from datetime import datetime
import threading

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO
import pg8000

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

DB_NAME = "project_akhir"
DB_USER = "postgres"
DB_PASSWORD = "1230987465"
DB_HOST = "localhost"

ROBOT_STATE = {
    "battery_robot": None,
    "orientation": {
        "yaw": 0.0,
        "pitch": 0.0,
        "roll": 0.0,
    },
    "yaw": 0.0,
    "pitch": 0.0,
    "roll": 0.0,
    "control_connected": False,
    "control_age_ms": None,
    "motor_drive": None,
    "motor_steer": None,
}
ROBOT_STATE_LOCK = threading.Lock()
LATEST_SENSOR_ROW = None
LATEST_SENSOR_ROW_LOCK = threading.Lock()


def get_db_connection():
    return pg8000.connect(
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
    )


def to_float(value, fallback=None):
    try:
        if value is None:
            return fallback
        return float(value)
    except (TypeError, ValueError):
        return fallback


def get_nested_value(source, keys):
    if not isinstance(source, dict):
        return None

    for key in keys:
        value = source.get(key)
        if value is not None:
            return value

    return None


def first_present(*values):
    for value in values:
        if value is not None:
            return value
    return None


def has_orientation_payload(payload):
    if not isinstance(payload, dict):
        return False

    direct_keys = ("yaw", "pitch", "roll", "yaw_deg", "pitch_deg", "roll_deg")
    if any(payload.get(key) is not None for key in direct_keys):
        return True

    return any(isinstance(payload.get(key), dict) for key in ("orientation", "imu", "mpu"))


def extract_orientation(payload):
    if not isinstance(payload, dict):
        return {"yaw": 0.0, "pitch": 0.0, "roll": 0.0}

    orientation = payload.get("orientation")
    imu = payload.get("imu")
    mpu = payload.get("mpu")

    yaw = first_present(
        payload.get("yaw"),
        payload.get("yaw_deg"),
        get_nested_value(orientation, ["yaw", "z"]),
        get_nested_value(imu, ["yaw", "z"]),
        get_nested_value(mpu, ["yaw", "z"]),
    )
    pitch = first_present(
        payload.get("pitch"),
        payload.get("pitch_deg"),
        get_nested_value(orientation, ["pitch", "x"]),
        get_nested_value(imu, ["pitch", "x"]),
        get_nested_value(mpu, ["pitch", "x"]),
    )
    roll = first_present(
        payload.get("roll"),
        payload.get("roll_deg"),
        get_nested_value(orientation, ["roll", "y"]),
        get_nested_value(imu, ["roll", "y"]),
        get_nested_value(mpu, ["roll", "y"]),
    )

    return {
        "yaw": to_float(yaw, 0.0),
        "pitch": to_float(pitch, 0.0),
        "roll": to_float(roll, 0.0),
    }


def update_robot_state(payload):
    with ROBOT_STATE_LOCK:
        if has_orientation_payload(payload):
            orientation = extract_orientation(payload)
            ROBOT_STATE["orientation"] = orientation
            ROBOT_STATE["yaw"] = orientation["yaw"]
            ROBOT_STATE["pitch"] = orientation["pitch"]
            ROBOT_STATE["roll"] = orientation["roll"]

        if "battery_robot" in payload:
            ROBOT_STATE["battery_robot"] = to_float(payload.get("battery_robot"))
        elif isinstance(payload.get("battery"), dict) and "robot" in payload["battery"]:
            ROBOT_STATE["battery_robot"] = to_float(payload["battery"].get("robot"))
        elif "battery" in payload:
            ROBOT_STATE["battery_robot"] = to_float(payload.get("battery"))

        for key in ("control_connected", "control_age_ms", "motor_drive", "motor_steer"):
            if key in payload:
                ROBOT_STATE[key] = payload.get(key)

        return dict(ROBOT_STATE)


def get_robot_state():
    with ROBOT_STATE_LOCK:
        return {
            **ROBOT_STATE,
            "orientation": dict(ROBOT_STATE["orientation"]),
        }


def normalize_timestamp(value):
    if isinstance(value, datetime):
        return value.isoformat()
    if value:
        return str(value)
    return datetime.now().isoformat()


def build_realtime_payload(row):
    robot_state = get_robot_state()
    status = row.get("status") or "Unknown"

    return {
        "timestamp": normalize_timestamp(row.get("timestamp")),
        "sensor": {
            "CO2": to_float(row.get("co2"), 0.0),
            "CO": to_float(row.get("co"), 0.0),
            "LPG": to_float(row.get("lpg"), 0.0),
            "H2S": to_float(row.get("h2s"), 0.0),
        },
        "prediction": {
            "area_level": status,
        },
        "co2_valid": row.get("co2") is not None,
        **robot_state,
    }


def set_latest_sensor_row(row):
    global LATEST_SENSOR_ROW

    with LATEST_SENSOR_ROW_LOCK:
        LATEST_SENSOR_ROW = dict(row) if row else None


def get_latest_sensor_row_cache():
    with LATEST_SENSOR_ROW_LOCK:
        return dict(LATEST_SENSOR_ROW) if LATEST_SENSOR_ROW else None


def fetch_latest_row():
    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
                timestamp,
                co2_ppm AS co2,
                co_ppm AS co,
                lpg_ppm AS lpg,
                h2s_ppm AS h2s,
                area_pred AS status
            FROM public.gas_log
            ORDER BY timestamp DESC
            LIMIT 1
            """
        )
        result = cursor.fetchone()

        if not result:
            return None

        columns = [desc[0] for desc in cursor.description]
        return dict(zip(columns, result))
    except Exception as error:
        print(f"[DB WARNING] Latest sensor data unavailable: {error}")
        return None
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def get_latest_sensor_data():
    row = fetch_latest_row()
    if not row:
        return None
    set_latest_sensor_row(row)
    return build_realtime_payload(row)


def get_cached_realtime_payload():
    return build_realtime_payload(get_latest_sensor_row_cache() or {})


def get_sensor_history(limit=20):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT
            timestamp,
            co2_ppm AS co2,
            co_ppm AS co,
            lpg_ppm AS lpg,
            h2s_ppm AS h2s,
            area_pred AS status
        FROM public.gas_log
        ORDER BY timestamp DESC
        LIMIT %s
        """,
        (limit,),
    )
    results = cursor.fetchall()
    columns = [desc[0] for desc in cursor.description]
    cursor.close()
    conn.close()

    data_list = []
    for row in results:
        data = dict(zip(columns, row))
        data["timestamp"] = normalize_timestamp(data.get("timestamp"))
        data_list.append(data)
    return data_list


@app.route("/api/sensor-data")
def get_sensor_data():
    data = get_latest_sensor_data()
    if data:
        return jsonify(data)
    return jsonify({"error": "No data available"}), 404


@app.route("/api/robot-state", methods=["GET", "POST"])
def robot_state_endpoint():
    if request.method == "POST":
        payload = request.get_json(silent=True) or {}
        state = update_robot_state(payload)
        socketio.emit("sensor_data", get_cached_realtime_payload())
        return jsonify({"ok": True, "robot_state": state})

    return jsonify(get_robot_state())


@app.route("/api/test")
def test_endpoint():
    data = get_latest_sensor_data()
    return jsonify({"message": "Test endpoint", "data": data})


@app.route("/api/history")
def get_history():
    data = get_sensor_history(20)
    return jsonify(data)


@app.route("/video_feed")
def video_feed():
    return "Video feed endpoint - implement camera streaming here"


@socketio.on("connect")
def handle_connect():
    socketio.emit("sensor_data", get_cached_realtime_payload(), to=request.sid)


def broadcast_sensor_data():
    while True:
        socketio.emit("sensor_data", get_latest_sensor_data() or get_cached_realtime_payload())
        socketio.sleep(1)


if __name__ == "__main__":
    socketio.start_background_task(broadcast_sensor_data)
    print("Starting Flask-SocketIO server on port 5001")
    socketio.run(app, host="0.0.0.0", port=5001, debug=False, allow_unsafe_werkzeug=True)

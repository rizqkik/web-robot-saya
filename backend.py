from flask import Flask, jsonify
from flask_cors import CORS
import pg8000
import asyncio
import websockets
import json
import threading
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Database configuration placeholders
DB_NAME = 'project_akhir'
DB_USER = 'postgres'
DB_PASSWORD = '1230987465'
DB_HOST = 'localhost'

def get_db_connection():
    return pg8000.connect(
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST
    )

def get_latest_sensor_data():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT timestamp, co2_ppm as co2, co_ppm as co, lpg_ppm as lpg, h2s_ppm as h2s, area_pred as status
        FROM public.gas_log
        ORDER BY timestamp DESC
        LIMIT 1
    """)
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    if result:
        # Create dict from result
        columns = [desc[0] for desc in cursor.description]
        data = dict(zip(columns, result))
        # Convert timestamp to ISO format string
        data['timestamp'] = data['timestamp'].isoformat()
        return data
    return None

def get_sensor_history(limit=20):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT timestamp, co2_ppm as co2, co_ppm as co, lpg_ppm as lpg, h2s_ppm as h2s, area_pred as status
        FROM public.gas_log
        ORDER BY timestamp DESC
        LIMIT %s
    """, (limit,))
    results = cursor.fetchall()
    columns = [desc[0] for desc in cursor.description]
    cursor.close()
    conn.close()
    # Convert to list of dicts
    data_list = []
    for row in results:
        data = dict(zip(columns, row))
        data['timestamp'] = data['timestamp'].isoformat()
        data_list.append(data)
    return data_list

@app.route('/api/sensor-data')
def get_sensor_data():
    data = get_latest_sensor_data()
    if data:
        return jsonify(data)
    return jsonify({'error': 'No data available'}), 404

@app.route('/api/history')
def get_history():
    data = get_sensor_history(20)  # Get last 20 records
    return jsonify(data)

@app.route('/video_feed')
def video_feed():
    # Placeholder for video feed endpoint
    return "Video feed endpoint - implement camera streaming here"

async def websocket_handler(websocket, path):
    print(f"WebSocket connection established: {path}")
    try:
        while True:
            data = get_latest_sensor_data()
            if data:
                await websocket.send(json.dumps(data))
            await asyncio.sleep(3)  # Send data every 3 seconds
    except websockets.exceptions.ConnectionClosed:
        print("WebSocket connection closed")

def start_websocket_server():
    print("Starting WebSocket server on port 7002")
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    server = websockets.serve(websocket_handler, "localhost", 7002)
    loop.run_until_complete(server)
    print("WebSocket server ready")
    loop.run_forever()

if __name__ == '__main__':
    # Start WebSocket server in background thread
    ws_thread = threading.Thread(target=start_websocket_server, daemon=True)
    ws_thread.start()

    print("Starting Flask server on port 5001")
    # Run Flask server
    app.run(host='0.0.0.0', port=5001, debug=False)
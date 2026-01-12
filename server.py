from flask import Flask, jsonify
import socket
import json
import random
import threading
import time
from datetime import datetime

app = Flask(__name__)

# Mock sensor data
def generate_sensor_data():
    return {
        'co2': random.randint(300, 600),
        'co': round(random.uniform(1.0, 10.0), 1),
        'lpg': random.randint(100, 1000),
        'h2s': round(random.uniform(0.01, 1.5), 2),
        'direction': random.randint(0, 360),
        'distance': round(random.uniform(5.0, 20.0), 1),
        'gasLocation': f'Sector {random.choice(["A", "B", "C"])}-{random.randint(1, 5)}',
        'timestamp': datetime.now().isoformat()
    }

@app.route('/api/sensor-data')
def get_sensor_data():
    return jsonify(generate_sensor_data())

@app.route('/video_feed')
def video_feed():
    # Placeholder for video feed endpoint
    return "Video feed endpoint - implement camera streaming here"

def websocket_server():
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server_socket.bind(('localhost', 12345))
    server_socket.listen(5)
    print("WebSocket server listening on port 12345")

    while True:
        client_socket, addr = server_socket.accept()
        print(f"Connection from {addr}")
        threading.Thread(target=handle_client, args=(client_socket,)).start()

def handle_client(client_socket):
    try:
        # Simple WebSocket handshake (simplified)
        handshake = client_socket.recv(1024).decode()
        if 'Upgrade: websocket' in handshake:
            response = "HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n\r\n"
            client_socket.send(response.encode())

            while True:
                data = generate_sensor_data()
                # Send as simple text frame (simplified WebSocket frame)
                message = json.dumps(data)
                frame = b'\x81' + bytes([len(message)]) + message.encode()
                client_socket.send(frame)
                time.sleep(3)
        else:
            client_socket.close()
    except:
        client_socket.close()

if __name__ == '__main__':
    # Start WebSocket server in background thread
    ws_thread = threading.Thread(target=websocket_server, daemon=True)
    ws_thread.start()

    print("Starting Flask server on port 5001")
    # Run Flask server
    app.run(host='0.0.0.0', port=5001, debug=True)
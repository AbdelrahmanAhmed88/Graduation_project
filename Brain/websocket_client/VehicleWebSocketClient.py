from asyncio.windows_events import NULL
import websocket
import json
import threading

class VehicleWebSocketClient:
    def __init__(self, vehicle_id, server_url):
        self.vehicle_id = vehicle_id
        self.server_url = server_url
        self.ws = None
        self.connected = False
        self.websocketMsgCallback = None

    def connect(self):
        self.ws = websocket.WebSocketApp(
            self.server_url,
            on_open=self.on_open,
            on_message=self.on_message,
            on_close=self.on_close,
            on_error=self.on_error
        )

        self.thread = threading.Thread(target=self.ws.run_forever)
        self.thread.daemon = True
        self.thread.start()

    def on_open(self, ws):
        self.connected = True
        print(f"Connected as vehicle {self.vehicle_id}")
        # Send subscription message
        subscribe_msg = json.dumps({
            "type": "subscribe",
            "vehicle_id": self.vehicle_id
        })
        ws.send(subscribe_msg)

    def on_message(self, ws, message):
        print(f"Message from server: {message}")
        if(self.websocketMsgCallback):
            self.websocketMsgCallback(message)

    def on_close(self, ws, close_status_code, close_msg):
        self.connected = False
        print("Connection closed")

    def on_error(self, ws, error):
        print(f"WebSocket error: {error}")

    def send_message(self, message_text,control_type = NULL,control_message= NULL):

        if self.connected and self.ws:
            msg = {
                "vehicle_id": self.vehicle_id,
                "message": message_text,
                "control_type": control_type,
                "control_message": control_message
            }
            self.ws.send(json.dumps(msg))
        else:
            print("Not connected to server.")

    def close(self):
        if self.ws:
            self.ws.close()
            self.ws = None
            self.connected = False

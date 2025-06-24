from asyncio.windows_events import NULL
import websocket
import threading
import json

class ScreenWebSocketClient:
    def __init__(self, uri="ws://localhost:8080"):
        self.uri = uri
        self.ws = None
        self.thread = None
        self.on_message_external = None

    def on_message(self, ws, message):
        # print("Received from Screen:", message)
        if self.on_message_external:
            self.on_message_external(message)

    def on_error(self, ws, error):
        print("Error:", error)

    def on_close(self, ws, close_status_code, close_msg):
        print("WebSocket closed:", close_status_code, close_msg)

    def on_open(self, ws):
        print("Connected to Screen")
        ws.send("python")

    def connect(self):
        self.ws = websocket.WebSocketApp(
            self.uri,
            on_open=self.on_open,
            on_message=self.on_message,
            on_error=self.on_error,
            on_close=self.on_close
        )
        self.thread = threading.Thread(target=self.ws.run_forever)
        self.thread.daemon = True
        self.thread.start()


    def display_message(self, message_type, message=NULL, notification = NULL):
        if self.ws and self.ws.sock and self.ws.sock.connected:
            data = {
                "type": message_type,
                "message": message,
                "notification": notification
            }
            self.ws.send(json.dumps(data))
        else:
            print("WebSocket not connected.")


    def close(self):
        if self.ws:
            self.ws.close()
            if self.thread:
                self.thread.join()


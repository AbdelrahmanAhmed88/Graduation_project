import asyncio
import websockets
import json

VEHICLE_ID = "1HGCM82633A004352"
SERVER_URL = "ws://192.168.100.202:8080"  # change this to match your server

async def test_websocket():
    async with websockets.connect(SERVER_URL) as ws:
        # Step 1: Subscribe with vehicle_id
        await ws.send("python")

        # Step 2: Send a message (simulate Python client)
        await asyncio.sleep(1)  # Wait a moment
        await ws.send(json.dumps({
            "type": "EMOTIONS_STATE",
            "message": "sad"
        }))
        print("Message sent!")
        return
        # Step 3: Wait for the broadcast (from server)
        # while True:
        #     try:
        #         response = await ws.recv()
        #         print("Received broadcast:", response)
        #     except websockets.exceptions.ConnectionClosed:
        #         print("Connection closed.")
        #         break

asyncio.run(test_websocket())

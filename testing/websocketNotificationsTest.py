import asyncio
import websockets
import json

VEHICLE_ID = "5YJ3E1EA7HF000314"
SERVER_URL = "ws://192.168.236.76:5000"  # change this to match your server

async def test_websocket():
    async with websockets.connect(SERVER_URL) as ws:
        # Step 1: Subscribe with vehicle_id
        await ws.send(json.dumps({
            "type": "subscribe",
            "vehicle_id": VEHICLE_ID
        }))
        print(f"Subscribed to vehicle: {VEHICLE_ID}")

        # Step 2: Send a message (simulate Python client)
        await asyncio.sleep(1)  # Wait a moment
        await ws.send(json.dumps({
            "vehicle_id": VEHICLE_ID,
            "message": "Eng rania"
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

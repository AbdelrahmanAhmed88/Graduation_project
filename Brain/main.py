from serial_reader.reader import SerialReader
from Models.faceCheckModelExec import face_check, store_encoding
from Models.drowsiness_distraction_ModelExec import DrowsinessDistractionDetectionexec, stop_drowsiness_distraction_detection
from carla_communication.carla_interface import update_drowsiness_mode, update_speed_limit
import subprocess
from config import vehicle_config
from config.driver_Data import session
import webbrowser
import time

#watcher for json file 
from carla_communication.vehicle_state_watcher import start_watching

#websockets for real-time notifications
from websocket_client.VehicleWebSocketClient import VehicleWebSocketClient
from screen_connection.screen_websocket_connection import ScreenWebSocketClient

vehicle_client = VehicleWebSocketClient(vehicle_config.VIN,vehicle_config.WEB_SOCKET_SERVER_URL)
vehicle_client.connect()

screen_client = ScreenWebSocketClient()
screen_client.connect()
time.sleep(1)



#apis
from api_client.backend_api import validate_nfc, get_user_data, update_user_data
from api_client.get_images import download_images_for_car  

reader = None  # Global reader

# driver_info = {}


# Callbacks
def my_callback(userID):
    print(f"Identity detected: {userID}")
    driver_info = get_user_data(userID)
    if(driver_info):
        reader.send("U")
        session.updateDriverData(driver_info["user"])
        if(session.speed_limit):
            update_speed_limit(session.max_speed)
        session.console_print()
        auth(userID,vehicle_config.VIN)
    else:
        reader.send("N")

# Global flags
is_drowsy = False
is_distracted = False
is_yawning = False

def DDD_callback(message):
    global is_drowsy, is_distracted, is_yawning

    if "DROWSINESS" in message:
        if not is_drowsy:
            is_drowsy = True
            is_yawning = True
            update_drowsiness_mode(True)
            screen_client.display_message("DROWSINESS_STATE", "Asleep")
            vehicle_client.send_message("Drowsiness detected. Please check on the driver to ensure they are okay.")
            session.updateDriverStates("Asleep","Focused")
            print("Drowsiness Action start!")
    elif "DISTRACTION" in message:
        if not is_distracted:
            is_distracted = True
            print("🚨 Distraction Alert!")
    elif "YAWNING" in message:
        if not is_yawning:
            is_yawning = True
            screen_client.display_message("DROWSINESS_STATE", "DROWSY")
            vehicle_client.send_message("The driver seems drowsy. Please make sure they're safe and alert.")
            session.updateDriverStates("Drowsy","Focused")
            print("Yawning Alert!")
    elif "NORMAL" in message or "FOCUSED" in message or "AWAKE" in message:
        # Reset all flags when driver returns to normal state
        is_drowsy = False
        is_distracted = False
        is_yawning = False
        screen_client.display_message("DROWSINESS_STATE", "Awake")
        print("Driver state normal. Resetting alerts.")



def openFirstTimeScreen():
    print(f"Opening first time screen")
    url = f"http://localhost:3000/?v={vehicle_config.VIN}&c={vehicle_config.CAR_MODEL}"
    
    try:
        # Use webbrowser to open the URL directly in the default browser
        webbrowser.open(url)
        
        # print("URL opened successfully")
    except Exception as e:
        print(f"Error opening the website: {e}")

def auth(user_id, vehicle_id):
    print(f"Opening website for user {user_id}")
    url = f"http://localhost:3000/Firsttimelogin2/Firsttimelogin3/HomePage?u={user_id}&v={vehicle_id}"
    
    try:
        # Use webbrowser to open the URL directly in the default browser
        webbrowser.open(url)
        vehicle_client.connect()
        time.sleep(2)
        screen_client.display_message("NOTIFICATION", f"Welcome {session.user_name}. You can now start the car.")
        vehicle_client.send_message(f"Welcome {session.user_name}. You can now start the car.")
        session.updateDriverStates("Awake","Focused")
        
        # print("URL opened successfully")
    except Exception as e:
        print(f"Error opening the website: {e}")

def masterCardAccessHomepage():
    print(f"Opening Homepage for mastercard")
    url = f"http://localhost:3000/Firsttimelogin2/Firsttimelogin3/HomePage?v={vehicle_config.VIN}"
    
    try:
        # Use webbrowser to open the URL directly in the default browser
        webbrowser.open(url)
        time.sleep(2)
        screen_client.display_message("NOTIFICATION", "Vehicle Unlocked by Master Card.")
        vehicle_client.send_message(f"Vehicle Unlocked by Master Card.")
        # print("URL opened successfully")
    except Exception as e:
        print(f"Error opening the website: {e}")



# Callback function to handle vehicle ID
def handle_vehicle_id(vehicle_id):
    print(f"🚗 Vehicle ID received: {vehicle_id}")
    # You can add any custom logic here for the vehicle ID
    # Example: Send it to a backend API, update a database, etc.

# Callback function to handle user signal (e.g., when 'u' is received)
def handle_user_signal():
    print("⚡ User signal received")
    # Add custom logic for when a user signal is received
    # Example: Trigger some action, like a user interface update or another system event

# Callback function to handle NFC ID (when 'n' is received)
def handle_nfc_id(nfc_id):
    print(f"NFC ID received: {nfc_id}")
    
    if nfc_id in vehicle_config.MASTER_CARDS:
        masterCardAccessHomepage()
    else:
        data = validate_nfc(nfc_id,vehicle_config.VIN)
        if(data):
            reader.send("O")
            download_images_for_car(vehicle_config.VIN)
            store_encoding()
            face_check(my_callback)
        else:
            reader.send("N")
    #print(data["nfc"]["status"])

# Callback function to handle commands (when 'c' is received)
def handle_command(command):
    if(command == 'exit'):
        vehicle_client.send_message("Goodbye! Don’t forget your phone")
        # print("Don't Forget your phone :D")
        vehicle_client.close()
    # Add your command handling logic here
    # Example: Control actuators, send responses, etc.

def on_vehicle_state_change(data, changes):
    print(f"[MAIN] vehicle_state.json changed:")
    
    for key, change in changes.items():
        print(f" - {key} changed from {change['old']} → {change['new']}")
    
    # Apply new speed limit if updated
    if 'driving_score' in changes and data.get("driving_score", 0) >= 0:
        update_user_data(session.user_id, {"driving_score": data.get("driving_score")})
    if 'engine_on' in changes and data.get("engine_on", 0) == True:
        print("Drwosiness and Distraction Detection start")
        DrowsinessDistractionDetectionexec(DDD_callback)
    if 'engine_on' in changes and data.get("engine_on", 0) == False:
        print("Drwosiness and Distraction Detection stop")
        stop_drowsiness_distraction_detection()




# Main program execution
def main():
    if(vehicle_config.FIRST_START == True):
        openFirstTimeScreen()

    start_watching(on_vehicle_state_change)
    # Create a SerialReader instance
    global reader
    reader = SerialReader(port=vehicle_config.SERIAL_PORT, baudrate=vehicle_config.BAUD_RATE, delimiter=vehicle_config.DELIMITER)

    # Assign the callback functions to handle each message type
    reader.on_vehicle_id = handle_vehicle_id
    reader.on_user_signal = handle_user_signal
    reader.on_nfc_id = handle_nfc_id
    reader.on_command = handle_command

    # Start reading from the serial port
    reader.start()


    # Keep the main thread alive (otherwise the program will exit immediately)
    try:
        while True:
            pass
    except KeyboardInterrupt:
        print("Program interrupted by user.")
        # You can stop the reader or perform cleanup here if needed

if __name__ == "__main__":
    main()

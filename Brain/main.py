from sympy import true
from serial_reader.reader import SerialReader
from Models.faceCheckModelExec import face_check, store_encoding
from Models.drowsiness_distraction_ModelExec import DrowsinessDistractionDetectionexec, stop_drowsiness_distraction_detection
from carla_communication.carla_interface import update_drowsiness_mode, update_speed_limit ,update_engine_on_state,get_driver_score,reset_driver_score,update_doors_locked_state,update_door_locked_state,is_doors_locked
import subprocess
from config import vehicle_config
from config.driver_Data import session
import webbrowser
import time
import json
import requests

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
from api_client.backend_api import validate_nfc, get_user_data, update_user_data, reset_current_driver_server_data
from api_client.get_images import download_images_for_car  

reader = None  # Global reader

# driver_info = {}

#variables
turned_off = False


# Callbacks
def my_callback(userID):
    print(f"Identity detected: {userID}")
    driver_info = get_user_data(userID)
    if(driver_info):
        session.updateDriverData(driver_info["user"])
        if(session.speed_limit):
            update_speed_limit(session.max_speed)
        session.console_print()
        auth(userID,vehicle_config.VIN)
    else:
        reader.send("N")

#callback function for actions from screen
def screen_on_message_callback(message):
    try:
        data = json.loads(message)
    except json.JSONDecodeError:
        print("Invalid JSON from screen.")
        return

    msg_type = data.get("type")
    msg_content = data.get("message")

    if msg_type == "DROWSINESS_STATE" :
        if msg_content == "AWAKE":
            print("Driver state set to 'Awake'. Resetting drowsiness-related flags.")
            reset_drowsiness_flags()
    if msg_type == "LOCK_STATE" :
        if msg_content == "UNLOCKED":
            reader.send("U")
            update_doors_locked_state(False)
        else:
            reader.send("L")
            update_doors_locked_state(True)




screen_client.on_message_external = screen_on_message_callback

# Global flags
is_drowsy = False
is_distracted = False
need_break = False

is_yawning = False
yawn_num = 0
last_yawn_time = 0

distraction_num = 0
last_distracted_time = 0

is_fear_detected = False

def is_driving_score_less_than_five():
    return get_driver_score() < 5


def reset_drowsiness_flags():
    global is_drowsy, is_distracted, is_yawning, yawn_num, last_yawn_time,last_distracted_time , distraction_num
    is_drowsy = False
    is_distracted = False
    is_yawning = False
    yawn_num = 0
    last_yawn_time = 0
    last_distracted_time = 0
    distraction_num = 0

    session.updateDriverStates("Awake","Focused")
    update_drowsiness_mode(False)

def DDD_callback(message):
    global is_drowsy, is_distracted, is_yawning ,yawn_num, last_yawn_time ,last_distracted_time, distraction_num

    current_time = time.time()
    if "DROWSINESS" in message:
        if not is_drowsy:
            is_drowsy = True
            is_yawning = True
            update_drowsiness_mode(True)
            screen_client.display_message("DROWSINESS_STATE", "Asleep")
            vehicle_client.send_message("Drowsiness detected. Please check on the driver to ensure they are okay.")
            session.updateDriverStates("Asleep","Focused")
            reader.send('A')
            print("Drowsiness Action start!")

    elif "DISTRACTION" in message:
        if (current_time - last_distracted_time) >= 5:
            is_distracted = False

        if not is_distracted:
            is_distracted = True
            distraction_num += 1
            if(is_fear_detected and distraction_num == 3):
                screen_client.display_message("EMOTIONS_STATE", "AUTOPILOT")
            last_distracted_time = current_time  
            session.updateDriverStates(focus_state="Distracted")
            screen_client.display_message("DISTRACTED_STATE", "Distracted")
            screen_client.display_message("You seem distracted — please pay attention.")
            print("Distraction Alert!")

    elif "YAWNING" in message:
        if (current_time - last_yawn_time) >= 2:  # Check 3-second cooldown
            last_yawn_time = current_time  # Update last yawn time
            if not is_yawning:
                if yawn_num == 2:
                    is_yawning = True
                    screen_client.display_message("DROWSINESS_STATE", "BREAK")
                else:
                    yawn_num += 1
                    screen_client.display_message("DROWSINESS_STATE", "DROWSY", "Feeling tired? It's okay to take a short break and refresh.")
                    vehicle_client.send_message("The driver seems drowsy. Please make sure they're safe and alert.")
                    session.updateDriverStates(drowsiness_state="Drowsy")
                    print("Yawning Alert!")
    elif "FOCUS" in message:
        is_distracted = False
        session.updateDriverStates(focus_state="focused")
        screen_client.display_message("DISTRACTED_STATE", "focused")

    elif "NORMAL" in message or "FOCUSED" in message or "AWAKE" in message:
        reset_drowsiness_flags()
        screen_client.display_message("DROWSINESS_STATE", "Awake")
        print("Driver state normal. Resetting alerts.")
    
    #Emotions part
    elif message in ['Angry', 'Fear', 'Happy', 'Neutral', 'Sad']:
        if (is_drowsy):
            print("drwosy priority is higher")
        elif message == 'Angry':
            if(is_driving_score_less_than_five()):
                screen_client.display_message("ASSISTANCE", "SAFETY", "Speed limit reduced to 60 for your safety due to detected anger and low driving score.")
                vehicle_client.send_message("Speed limit reduced to 60 for your safety due to detected anger and low driving score.")
                update_speed_limit(60)

            screen_client.display_message("EMOTIONS_STATE", "ANGRY", "Feeling tense? Let's take a few deep breaths together. Safe driving is the best kind of driving.")
            session.updateDriverStates(emotion_state="Angry")
        elif message == 'Fear':
            if(is_distracted and not get_assistance_mode()):
                screen_client.display_message("EMOTIONS_STATE", "AUTOPILOT")
                update_assistance_mode(True)
            screen_client.display_message("EMOTIONS_STATE", "FEAR", "Everything's okay. Drive steady—you're in control. We're here with you.")
            session.updateDriverStates(emotion_state="Fear")

        elif message == 'Happy':
            if(is_driving_score_less_than_five()):
                screen_client.display_message("ASSISTANCE", "SAFETY", "Speed limit reduced to 60 for your safety due to detected Happy and low driving score.")
                vehicle_client.send_message("Speed limit reduced to 60 for your safety due to detected over Happy and low driving score.")
                update_speed_limit(60)

            screen_client.display_message("EMOTIONS_STATE", "HAPPY","Love the good vibes! Keep smiling and drive safe.")
            session.updateDriverStates(emotion_state="Happy")
        elif message == 'Neutral':
            screen_client.display_message("EMOTIONS_STATE", "NEUTRAL","Smooth and steady. You're doing great—let's keep it that way.")
            session.updateDriverStates(emotion_state="Neutral")
        elif message == 'Sad':
            screen_client.display_message("EMOTIONS_STATE", "SAD", "Tough moment? You're not alone. Let's focus on the road—better times ahead.")
            session.updateDriverStates(emotion_state="Sad")
        else:
            print("Unknown emotion")
    else:
        print(message)



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
    print(f"updating Screen for user {user_id}")

   
    screen_client.display_message("USERCREDENTIALS",user_id)
    screen_client.display_message("NOTIFICATION", f"Welcome {session.user_name}. You can now start the car.")
    vehicle_client.send_message(f"Welcome {session.user_name}. You can now start the car.",control_type="update_current_user")
    session.updateDriverStates("Awake","Focused")
    # try:
    #     # Use webbrowser to open the URL directly in the default browser
    #     url = f"http://localhost:3000/Firsttimelogin2/Firsttimelogin3/HomePage?u={user_id}&v={vehicle_id}"
    #     webbrowser.open(url)
    #     time.sleep(2) 
    #     screen_client.display_message("NOTIFICATION", f"Welcome {session.user_name}. You can now start the car.")
    #     vehicle_client.send_message(f"Welcome {session.user_name}. You can now start the car.",control_type="update_current_user")
    #     session.updateDriverStates("Awake","Focused")
        
    #     # print("URL opened successfully")
    # except Exception as e:
    #     print(f"Error opening the website: {e}")

def masterCardAccessHomepage():
    screen_client.display_message("NOTIFICATION", "Vehicle Unlocked by Master Card.")
    screen_client.display_message("USERCREDENTIALS","Master")
    vehicle_client.send_message(f"Vehicle Unlocked by Master Card.")
    # print("URL opened successfully")
        

# Callback function to handle vehicle ID
def handle_vehicle_id(vehicle_id):
    print(f"Vehicle ID received: {vehicle_id}")
    # You can add any custom logic here for the vehicle ID
    # Example: Send it to a backend API, update a database, etc.

# Callback function to handle user signal (e.g., when 'u' is received)
def handle_user_signal():
    print("User signal received")
    # Add custom logic for when a user signal is received
    # Example: Trigger some action, like a user interface update or another system event

# Callback function to handle NFC ID (when 'n' is received)
def handle_nfc_id(nfc_id):
    print(f"NFC ID received: {nfc_id}")
    
    if nfc_id in vehicle_config.MASTER_CARDS:
        if is_doors_locked():
            reader.send("U")
            session.user_id = "Master"
            update_door_locked_state(False)
            masterCardAccessHomepage()
        else:
            reader.send("L")
            update_door_locked_state(True)
    else:
        data = validate_nfc(nfc_id,vehicle_config.VIN)
        if(data):
            if is_doors_locked():
                reader.send("U")
                update_door_locked_state(False)
                api_url = f"http://localhost:5000/api/vehicles/{vehicle_config.VIN}"
                response = requests.get(api_url)
                
                response.raise_for_status()  # This will throw an error if the status code is not 2xx

                data = response.json()

                usersUpdated = data['vehicle']['updated']

                if(usersUpdated):
                    download_images_for_car(vehicle_config.VIN)
                    store_encoding()
                else:
                    print("No users update")
                screen_client.display_message("USERCREDENTIALS","IDENTIFYING")
                face_check(my_callback)
            else:
                reader.send("L")
                update_door_locked_state(True)
        else:
            reader.send("N")

# Callback function to handle commands (when 'c' is received)
def handle_command(command):
    if(command == 'exit'):
        print("exit")
        stop_drowsiness_distraction_detection()
        update_engine_on_state(False)
    elif(command == 'start'):
        if(session.user_id):
            update_engine_on_state(True)
        else:
            screen_client.display_message("USERCREDENTIALS","IDENTIFYING")
            face_check(my_callback)


def on_vehicle_state_change(data, changes):
    global turned_off

    print(f"[MAIN] vehicle_state.json changed:")
    
    for key, change in changes.items():
        print(f" - {key} changed from {change['old']} → {change['new']}")
    
    # Apply new speed limit if updated
    if 'driving_score' in changes and data.get("driving_score", 0) >= 0:
        update_user_data(session.user_id, {"driving_score": data.get("driving_score")})
        screen_client.display_message("DRIVING_SCORE", data.get("driving_score"))

    if 'engine_on' in changes and data.get("engine_on") is True:
        screen_client.display_message("Control", "STARTDISPLAY")
        screen_client.display_message("NOTIFICATION", "Engine started.")
        vehicle_client.send_message("Engine started.")
        reset_drowsiness_flags()
        DrowsinessDistractionDetectionexec(DDD_callback)

    if 'engine_on' in changes and data.get("engine_on") is False:
        screen_client.display_message("NOTIFICATION", "Goodbye! Don’t forget your phone")
        vehicle_client.send_message("Don’t forget your phone")
        turned_off = True
        screen_client.display_message("Control", "ClOSEDISPLAY")
        if(session.user_id != "Master"):
            session.resetDriverStates()
    if 'doors_locked' in changes and data.get("doors_locked") is True:
        if(turned_off):
            session.resetDriverStates()
            reset_driver_score()
            turned_off = False


import json

def onMobileMsg(msg):

    msg = json.loads(msg)

    if msg.get("message_title") == "MOBILECMD":
        if msg.get("message") == "ALARM":
                reader.send('A')
        if msg.get("message") == "LOCK":
            reader.send('L')
            update_door_locked_state(True)
        if msg.get("message") == "UNLOCK":
            reader.send('U')
            update_door_locked_state(False)



vehicle_client.websocketMsgCallback = onMobileMsg


# Main program execution
def main():
    if(vehicle_config.FIRST_START):
            openFirstTimeScreen()
    else:
        url = f"http://localhost:3000/Firsttimelogin2/Firsttimelogin3/HomePage?v={vehicle_config.VIN}"
            
        try:
            # Use webbrowser to open the URL directly in the default browser
            webbrowser.open(url)

        except Exception as e:
            print(f"Error opening the website: {e}")


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

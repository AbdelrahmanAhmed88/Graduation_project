import json

import os

STATES_FILE = os.path.join(os.path.dirname(__file__), "vehicle_state.json")


MAX_SPEED_DEFAULT = 220

def get_max_speed():
    try:
        with open(STATES_FILE, 'r') as f:
            data = json.load(f)
            return data.get("speed_limit") or MAX_SPEED_DEFAULT
    except Exception as e:
        print(f"[CONFIG] Failed to load speed_limit from JSON: {e}")
        return MAX_SPEED_DEFAULT

# config.py
TOWN = 'Town04'

# Environment flags
# ['Buildings', 'Decals', 'Foliage', 'Ground', 'ParkedVehicles', 'Particles', 'Props', 'Walls']
remove_ele = ['Buildings', 'Decals', 'Foliage', 'Ground', 'ParkedVehicles', 'Particles', 'Props', 'Walls']

PEOPLE_Town = {
    'flag': False,
    'num': 5
}

VEHICLE_Town = {
    'flag': False,
    'num': 10
}

TRAFFIC = False  # Flag to enable traffic management

RESOLUTION = (850, 480)  
FRAME_RATE = 25  

OUTPUT_DIR = "Record"    # Directory for video and screenshot output
Summary_Dir = "Summary"  # Directory for anomaly summary files

VEHICLE_MODEL = "vehicle.tesla.model3" 
SPAWN_POINT_INDEX = 0

CAMERA_FOV = "90"  
CAMERA_POSITION = {"x": 1.5, "z": 1.4, "pitch": 0, "yaw": 0} 

BASE_SPEED = 10          # Initial base speed in km/h (not used directly in new control scheme)
SPEED_INCREMENT = 0.1    # Throttle increment for Z/X keys (previously Inc_Speed)
Inc_Speed = 10
MAX_SPEED =  get_max_speed()           # Maximum speed in km/h (used for display purposes)
MAX_ERRORS_ALLOWED = 10

# Monitoring
refresh_monitoring = 5.0    # (sec)

# Monitoring obstacles
Max_dis = 30    # m
Min_dis = 20    # m

# Monitoring collision
Base_Threshold = 20000      # (kg·m/s)
Ref_Speed = 16.67           # (60 km/h = 16.67 m/s)
Ref_Mass = 1800             # (Kg)

# Pnishment for
Stop_for = 30.0
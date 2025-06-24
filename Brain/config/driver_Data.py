# driver_Data.py
import time

from sympy import N
from sympy.parsing.sympy_parser import null
from api_client.backend_api import update_current_driver_data , reset_current_driver_server_data

class DriverSession:
    def __init__(self):
        self.user_name = ""
        self.user_id = ""
        self.speed_limit = False
        self.max_speed = 0
        self.aggressive_mode = False
        self.drowsiness_mode = False
        self.drowsiness_state = null
        self.focus_mode = False
        self.focus_state = null
        self.start_time = 0

    def updateDriverData(self,user_data: dict):
        self.user_name = user_data["name"]
        self.user_id = user_data["user_id"]
        self.speed_limit = user_data["speed_limit"]
        self.max_speed = user_data["max_speed"]
        self.aggressive_mode = user_data["aggressive_mode"]
        self.drowsiness_mode = user_data["drowsiness_mode"]
        self.focus_mode = user_data["focus_mode"]
        self.start_time = time.time()
    
    def updateDriverStates(self, drowsiness_state=None, focus_state=None):
        if drowsiness_state is not None:
            self.drowsiness_state = drowsiness_state

        if focus_state is not None:
            self.focus_state = focus_state

        update_current_driver_data(
            self.user_id,
            self.start_time,
            self.drowsiness_state,
            self.focus_state
        )


    def resetDriverStates(self):
        self.drowsiness_state = null
        self.focus_state = null
        reset_current_driver_server_data()

    def console_print(self):
        print("Driver Name: ", self.user_name)
        print("Driver ID: ", self.user_id)
        print("Speed Limit: ", self.speed_limit)
        print("Max Speed: ", self.max_speed)
        print("Aggressive Mode: ", self.aggressive_mode)
        print("Drowsiness Mode: ", self.drowsiness_mode)
        print("Focus Mode: ", self.focus_mode)
        print("Start Time: ", self.start_time)  
        

session = DriverSession()

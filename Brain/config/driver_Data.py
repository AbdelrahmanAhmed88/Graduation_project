# driver_Data.py
import time

class DriverSession:
    def __init__(self):
        self.user_name = ""
        self.user_id = ""
        self.speed_limit = False
        self.max_speed = 0
        self.aggressive_mode = False
        self.drowsiness_mode = False
        self.focus_mode = False
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

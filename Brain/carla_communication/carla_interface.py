import json
import threading
import os
import tempfile
import shutil

STATES_FILE = r"C:\Bedo\github_repo\Graduation_project\Carla 0.9.11\vehicle_state.json"
_lock = threading.Lock()

def read_state():
    with _lock:
        try:
            with open (STATES_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"[Read Error] {e}")
            return {}

def write_state(data: dict):
    with _lock:
        try:
            dir_name = os.path.dirname(STATES_FILE)
            with tempfile.NamedTemporaryFile('w', dir=dir_name, delete=False) as tmp_file:
                json.dump(data, tmp_file, indent=4)
                tmp_file.flush()
                os.fsync(tmp_file.fileno())
            shutil.move(tmp_file.name, STATES_FILE)
        except Exception as e:
            print(f"[Write Error] {e}")

def update_drowsiness_mode(mode: bool):
    state = read_state()
    state["drowsiness_mode"] = mode
    write_state(state)

def update_engine_on_state(mode: bool):
    state = read_state()
    state["engine_on"] = mode
    write_state(state)

def update_doors_locked_state(mode: bool):
    state = read_state()
    state["doors_locked"] = mode
    write_state(state)

def reset_driver_score():
    state = read_state()
    state["driving_score"] = 10
    write_state(state)

def update_speed_limit(new_limit: int):
    state = read_state()
    state["speed_limit"] = new_limit
    write_state(state)

def is_doors_locked():
    state = read_state()
    return state["doors_locked"]

def update_door_locked_state(locked: bool):
    state = read_state()
    state["doors_locked"] = locked
    write_state(state)
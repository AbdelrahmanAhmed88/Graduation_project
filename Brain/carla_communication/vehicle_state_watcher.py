import json
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import time
import threading

STATES_FILE = r"C:\Bedo\Graduation project\Carla\Carla 0.9.11\vehicle_state.json"

class VehicleStateHandler(FileSystemEventHandler):
    def __init__(self, callback):
        super().__init__()
        self.callback = callback
        self.last_state = None  # Store previous state

    def on_modified(self, event):
        if event.src_path == STATES_FILE:
            try:
                with open(STATES_FILE, 'r') as f:
                    current_state = json.load(f)

                if self.last_state is not None:
                    changes = self.detect_changes(self.last_state, current_state)
                    if changes:
                        self.callback(current_state, changes)

                self.last_state = current_state  # Update saved state
            except Exception as e:
                print(f"[Watcher] Failed to read updated state: {e}")

    def detect_changes(self, old, new):
        changes = {}
        for key in new:
            if key not in old or new[key] != old[key]:
                changes[key] = {
                    "old": old.get(key),
                    "new": new[key]
                }
        return changes

def start_watching(callback):
    event_handler = VehicleStateHandler(callback)
    observer = Observer()
    observer.schedule(event_handler, path=STATES_FILE.rsplit("\\", 1)[0], recursive=False)
    observer_thread = threading.Thread(target=observer.start, daemon=True)
    observer_thread.start()
    print("[Watcher] Started monitoring vehicle_state.json")

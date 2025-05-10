import sys
import os

def Start():
     egg_path = "D:/Carla/WindowsNoEditor/PythonAPI/carla/dist/carla-0.9.11-py3.7-win-amd64.egg"
     if not os.path.exists(egg_path):
          print(f"Error: CARLA .egg file not found at {egg_path}")
          sys.exit(1)
     
     # Remove any existing carla module from sys.modules
     if 'carla' in sys.modules:
          del sys.modules['carla']
     
     # Insert .egg path at the beginning of sys.path
     sys.path.insert(0, egg_path)
     
     try:
          import carla
          print(f"Loaded CARLA .egg from: {egg_path}")
          # Check version if available
          version = getattr(carla, '__version__', None)
          if version is None:
               print("Warning: CARLA module does not have '__version__' attribute. Assuming version 0.9.11.")
          elif version != '0.9.11':
               print(f"Error: Loaded CARLA version {version}, expected 0.9.11")
               sys.exit(1)
          else:
               print(f"CARLA version: {version}")
     except Exception as e:
          print(f"Failed to load .egg file: {e}")
          sys.exit(1)
          
from config import VEHICLE_MODEL, SPAWN_POINT_INDEX

class Create_Vehicle:
     '''
     Attributes:
          - world_obj: The World object containing the CARLA world and its settings.
          - vehicle_bp: The blueprint of the vehicle to be spawned.
          - spawn_points: List of available spawn points in the map.
          - transform: The specific spawn point transform for the vehicle.
          - vehicle: The spawned vehicle actor in the CARLA world.

     Functions:
          - __init__(self, world_obj): 
               Initializes the vehicle by selecting a blueprint, choosing a spawn point, and spawning the vehicle in the CARLA world.
          - get_attached_sensors(self): 
               Retrieves all sensors attached to the vehicle.
          - cleanup(self): 
               Destroys the vehicle actor to clean up resources.
     '''
     def __init__(self, world_obj):
          self.world_obj = world_obj
          
          print("Getting vehicle blueprint...", end='', flush=True)
          self.vehicle_bp = world_obj.blueprint_library.filter(VEHICLE_MODEL)[0]
          self.spawn_points = world_obj.world.get_map().get_spawn_points()
          self.transform = self.spawn_points[SPAWN_POINT_INDEX % len(self.spawn_points)]  # Ensure index is valid
          self.vehicle = world_obj.world.spawn_actor(self.vehicle_bp, self.transform)
          print("Done")

     def get_attached_sensors(self):
          """
          Retrieve all sensors attached to the given vehicle.
          
          Returns:
               List of CARLA sensor actors attached to the vehicle.
          """
          # Access the CARLA world
          world = self.vehicle.get_world()
          
          # Get all actors in the world
          actors = world.get_actors()
          
          # Filter actors to find sensors attached to the vehicle
          sensors = [actor for actor in actors if actor.parent == self.vehicle and actor.type_id.startswith('sensor.')]
          
          # Print sensor details only if sensors are found
          if sensors:
               print(f"Found {len(sensors)} sensors attached to vehicle (ID: {self.vehicle.id}):")
               for sensor in sensors:
                    print(f" - Sensor: {sensor.type_id} (ID: {sensor.id})")
          
          return sensors

     def cleanup(self):
          print("Cleaning up vehicle...", end='', flush=True)
          try:
               if self.vehicle is not None and self.vehicle.is_alive:
                    self.vehicle.destroy()
                    self.vehicle = None
          except Exception as e:
               print(f"Error destroying vehicle: {e}")
          print("Done")

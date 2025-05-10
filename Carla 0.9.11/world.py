import carla
import random
from config import TOWN, remove_ele, PEOPLE_Town, VEHICLE_Town, TRAFFIC, SPAWN_POINT_INDEX

class World:
     def __init__(self):
          self.world = None
          self.blueprint_library = None
          self.client = carla.Client('localhost', 2000)
          self.client.set_timeout(50.0)
          self.world = self.client.get_world()
          self.world = self.client.load_world(TOWN)
          map = self.world.get_map()
          print(f"Map loaded: {map.name}")
          self.blueprint_library = self.world.get_blueprint_library()
          self.actors = []  # To track spawned pedestrians and vehicles
          self.setup_world()

     def setup_world(self):
          """Configure the world based on config flags."""
          # Remove specified map layers
          if remove_ele:
               print("Removing specified map layers...")
               valid_layers = {
                    "Buildings": carla.MapLayer.Buildings,
                    "Decals": carla.MapLayer.Decals,
                    "Foliage": carla.MapLayer.Foliage,
                    "Ground": carla.MapLayer.Ground,
                    "ParkedVehicles": carla.MapLayer.ParkedVehicles,
                    "Particles": carla.MapLayer.Particles,
                    "Props": carla.MapLayer.Props,
                    "Walls": carla.MapLayer.Walls
               }
               for layer_name in remove_ele:
                    if layer_name in valid_layers:
                         print(f"Unloading map layer: {layer_name}")
                         self.world.unload_map_layer(valid_layers[layer_name])
                    else:
                         print(f"Warning: Invalid map layer '{layer_name}'. Valid layers: {list(valid_layers.keys())}")

          # Spawn pedestrians if PEOPLE_Town['flag'] is True
          if PEOPLE_Town['flag']:
               print("Spawning pedestrians across the town...")
               self.spawn_pedestrians(num_pedestrians=PEOPLE_Town['num'])

          # Spawn vehicles if VEHICLE_Town['flag'] is True
          if VEHICLE_Town['flag']:
               print("Spawning vehicles across the town...")
               self.spawn_vehicles(num_vehicles=VEHICLE_Town['num'])

          # Enable traffic management if TRAFFIC is True
          if TRAFFIC:
               print("Enabling traffic management...")
               self.setup_traffic()

     def spawn_pedestrians(self, num_pedestrians):
          """Spawn pedestrians at random spawn points across the town."""
          print(f"Attempting to spawn {num_pedestrians} pedestrians...")
          pedestrian_bps = self.blueprint_library.filter("walker.pedestrian.*")
          spawn_points = self.world.get_map().get_spawn_points()
          print(f"Available spawn points: {len(spawn_points)}")
          if not spawn_points:
               raise RuntimeError("No spawn points available in the map!")
          if num_pedestrians > len(spawn_points):
               print(f"Warning: Requested {num_pedestrians} pedestrians, but only {len(spawn_points)} spawn points available. Limiting to {len(spawn_points)}.")
               num_pedestrians = len(spawn_points)
          random.shuffle(spawn_points)

          for i in range(num_pedestrians):
               blueprint = random.choice(pedestrian_bps)
               spawn_point = spawn_points[i % len(spawn_points)]
               # Adjust spawn point to ground level
               spawn_point.location.z += 0.5  # Slightly above ground to avoid spawning issues
               print(f"Spawning pedestrian {i+1} at location: {spawn_point.location}")
               try:
                    pedestrian = self.world.spawn_actor(blueprint, spawn_point)
                    self.actors.append(pedestrian)
                    print(f"Pedestrian {i+1} spawned successfully (ID: {pedestrian.id})")
                    # Add AI controller for walking behavior
                    controller_bp = self.blueprint_library.find('controller.ai.walker')
                    controller = self.world.spawn_actor(controller_bp, carla.Transform(), pedestrian)
                    self.actors.append(controller)
                    controller.start()
                    controller.go_to_location(self.world.get_random_location_from_navigation())
                    controller.set_max_speed(1.0 + random.random())  # Random walking speed
                    print(f"AI controller for pedestrian {i+1} started")
               except Exception as e:
                    print(f"Failed to spawn pedestrian {i+1}: {e}")
                    # Continue to try spawning remaining pedestrians
                    continue

          print(f"Finished spawning pedestrians. Total spawned: {sum(1 for actor in self.actors if actor.type_id.startswith('walker.pedestrian'))}")

     def spawn_vehicles(self, num_vehicles):
          """Spawn vehicles at random spawn points across the town."""
          print(f"Attempting to spawn {num_vehicles} vehicles...")
          vehicle_bps = self.blueprint_library.filter("vehicle.*")
          spawn_points = self.world.get_map().get_spawn_points()
          print(f"Available spawn points: {len(spawn_points)}")
          if not spawn_points:
               raise RuntimeError("No spawn points available in the map!")
          if num_vehicles > len(spawn_points):
               print(f"Warning: Requested {num_vehicles} vehicles, but only {len(spawn_points)} spawn points available. Limiting to {len(spawn_points)}.")
               num_vehicles = len(spawn_points)
          random.shuffle(spawn_points)

          for i in range(num_vehicles):
               blueprint = random.choice(vehicle_bps)
               spawn_point = spawn_points[i % len(spawn_points)]
               print(f"Spawning vehicle {i+1} at location: {spawn_point.location}")
               try:
                    vehicle = self.world.spawn_actor(blueprint, spawn_point)
                    self.actors.append(vehicle)
                    vehicle.set_autopilot(True)  # Enable AI driving
                    print(f"Vehicle {i+1} spawned successfully (ID: {vehicle.id})")
               except Exception as e:
                    print(f"Failed to spawn vehicle {i+1}: {e}")
                    continue

          print(f"Finished spawning vehicles. Total spawned: {sum(1 for actor in self.actors if actor.type_id.startswith('vehicle'))}")

     def setup_traffic(self):
          """Configure traffic management (e.g., traffic lights, vehicle AI)."""
          print("Configuring traffic manager...")
          traffic_manager = self.client.get_trafficmanager()
          traffic_manager.set_synchronous_mode(True)
          traffic_manager.set_global_distance_to_leading_vehicle(2.0)
          traffic_manager.global_percentage_speed_difference(30.0)  # Randomize speeds
          print("Traffic manager configured")

          print("Configuring traffic lights...")
          for actor in self.world.get_actors().filter('traffic.traffic_light'):
               actor.set_state(carla.TrafficLightState.Green)
               actor.set_green_time(30.0)
               actor.set_red_time(15.0)
               actor.set_yellow_time(5.0)
          print("Traffic lights configured")

     def cleanup(self):
          """Clean up spawned actors and reset world settings."""
          print("Cleaning up world actors...")
          for actor in self.actors:
               if actor.is_alive:
                    if actor.type_id.startswith('controller.ai.walker'):
                         actor.stop()
                    actor.destroy()
          self.actors.clear()
          # Reset traffic manager
          if TRAFFIC:
               traffic_manager = self.client.get_trafficmanager()
               traffic_manager.set_synchronous_mode(False)
          # Reload all map layers to reset the map
          if remove_ele:
               print("Reloading all map layers...")
               self.world.load_map_layer(carla.MapLayer.All)
          print("World cleanup complete.")

     def get_spawn_point(self):
          """Return the configured spawn point for the player vehicle."""
          spawn_points = self.world.get_map().get_spawn_points()
          return spawn_points[SPAWN_POINT_INDEX % len(spawn_points)]


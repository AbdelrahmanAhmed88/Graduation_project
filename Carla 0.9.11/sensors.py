import pygame
import carla
import numpy as np
import weakref
import os
import cv2
from collections import deque
from video_recording import get_unique_filename
from config import RESOLUTION, FRAME_RATE, OUTPUT_DIR, CAMERA_FOV, CAMERA_POSITION

class World(object):
    '''
    Attributes:
        - world: The CARLA world object representing the simulation environment.
        - player: The vehicle actor being controlled in the simulation.
        - camera_manager: The CameraManager object handling the camera sensor.
        - collision_sensor: The CollisionSensor object monitoring collisions.
        - lane_invasion_sensor: The LaneInvasionSensor object detecting lane invasions.
        - obstacle_detector: The ObstacleDetector object detecting nearby obstacles.
        - imu_sensor: The IMUSensor object capturing acceleration and angular velocity.
        - frame: The current simulation frame number.
        - simulation_time: The elapsed time in the simulation.
        - _tick_callback: The callback ID for the world tick event.

    Functions:
        - __init__(self, carla_world, vehicle, camera, video_frames): 
            Initializes the World with a vehicle, camera, and sensors, and sets up a tick callback.
        - _tick(self, timestamp): 
            Updates frame and simulation time.
        - tick(self, clock): 
            Updates sensor histories and checks for events.
        - render(self, display): 
            Renders the camera feed to the Pygame display.
        - destroy(self): 
            Cleans up sensors and removes the tick callback.
    '''
    def __init__(self, carla_world, vehicle, camera, video_frames):
        self.world = carla_world
        self.player = vehicle
        print("Initializing CameraManager...")
        self.camera_manager = CameraManager(self.player, video_frames)
        self.camera_manager.set_sensor(0, notify=False)
        print(f"Camera sensor spawned (ID: {self.camera_manager.sensor.id})")
        
        print("Initializing CollisionSensor...")
        self.collision_sensor = CollisionSensor(self.player)
        print(f"Collision sensor spawned (ID: {self.collision_sensor.sensor.id})")
        
        print("Initializing LaneInvasionSensor...")
        self.lane_invasion_sensor = LaneInvasionSensor(self.player)
        print(f"Lane invasion sensor spawned (ID: {self.lane_invasion_sensor.sensor.id})")
        
        print("Initializing ObstacleDetector...")
        self.obstacle_detector = ObstacleDetector(self.player)
        print(f"Obstacle detector spawned (ID: {self.obstacle_detector.sensor.id})")
        
        print("Initializing IMUSensor...")
        self.imu_sensor = IMUSensor(self.player)
        print(f"IMU sensor spawned (ID: {self.imu_sensor.sensor.id})")
        
        self._tick_callback = self.world.on_tick(self._tick)
        self.frame = None
        self.simulation_time = None

    def _tick(self, timestamp):
        self.frame = timestamp.frame
        self.simulation_time = timestamp.elapsed_seconds

    def tick(self, clock):
        pass

    def render(self, display):
        self.camera_manager.render(display)

    def destroy(self):
        print("Destroying World sensors...", end='', flush=True)
        if self.camera_manager is not None:
            self.camera_manager.cleanup()
            self.camera_manager = None
        sensors = [
            self.collision_sensor,
            self.lane_invasion_sensor,
            self.obstacle_detector,
            self.imu_sensor
        ]
        for sensor in sensors:
            if sensor is not None:
                sensor.cleanup()
        self.player = None
        if self._tick_callback is not None:
            self.world.remove_on_tick(self._tick_callback)
            self._tick_callback = None
        print("Done")

class CameraManager(object):
    '''
    Attributes:
        - sensor: The CARLA sensor actor (e.g., RGB camera) attached to the parent vehicle.
        - surface: The Pygame surface for rendering camera images.
        - _parent: The parent vehicle actor to which the camera is attached.
        - video_frames: List to store video frames for recording.
        - video_writer: The OpenCV VideoWriter object for saving video.
        - sensors: List of sensor configurations (e.g., RGB camera blueprint).
        - index: The current sensor index in use.

    Functions:
        - __init__(self, parent_actor, video_frames): 
            Initializes the camera manager with a parent vehicle and video frame storage.
        - set_sensor(self, index, notify=True, force_respawn=False): 
            Spawns or updates the camera sensor with the specified index.
        - render(self, display): 
            Renders the camera image to the Pygame display.
        - _parse_image(weak_self, image): 
            Processes camera images, converts them to NumPy arrays, and stores them for video recording or rendering.
        - cleanup(self):
            Stops and destroys the camera sensor and releases the video writer.
    '''
    def __init__(self, parent_actor, video_frames):
        self.sensor = None
        self.surface = None
        self._parent = parent_actor
        self.video_frames = video_frames
        self.video_writer = None
        self.sensors = [['sensor.camera.rgb', carla.ColorConverter.Raw, 'Camera RGB', {}]]
        
        world = self._parent.get_world()
        bp_library = world.get_blueprint_library()

        for item in self.sensors:
            bp = bp_library.find(item[0])
            bp.set_attribute('image_size_x', str(RESOLUTION[0]))
            bp.set_attribute('image_size_y', str(RESOLUTION[1]))
            bp.set_attribute('fov', str(CAMERA_FOV))
            item.append(bp)
        self.index = None

        self.camera_views = [
            carla.Transform(carla.Location(x=1.5, z=1.4), carla.Rotation(pitch=0, yaw=0)),
            carla.Transform(carla.Location(x=-5.0, z=3.0), carla.Rotation(pitch=-20, yaw=0))
        ]
        self.current_view_index = 0

    def set_sensor(self, index, notify=True, force_respawn=False, custom_transform=None):
        index = index % len(self.sensors)
    
        if self.sensor is not None and self.sensor.is_alive:
            self.sensor.stop()
            self.sensor.destroy()
            self.sensor = None
            self.surface = None
    
        transform = custom_transform if custom_transform is not None else self.camera_views[self.current_view_index]
        self.sensor = self._parent.get_world().spawn_actor(
            self.sensors[index][-1],
            transform,
            attach_to=self._parent,
            attachment_type=carla.AttachmentType.Rigid)
    
        weak_self = weakref.ref(self)
        self.sensor.listen(lambda image: CameraManager._parse_image(weak_self, image))
        self.index = index

    def toggle_view(self):
        self.current_view_index = (self.current_view_index + 1) % len(self.camera_views)
        view_name = "The Road" if self.current_view_index == 0 else "The Car on the Road"
        self.set_sensor(self.index, custom_transform=self.camera_views[self.current_view_index])
        print(f"Switched to view: {view_name}")

    def render(self, display):
        if self.surface is not None:
            display.blit(self.surface, (0, 0))

    def cleanup(self):
        print("Cleaning up CameraManager sensor...", end='', flush=True)
        if self.sensor is not None and self.sensor.is_alive:
            self.sensor.stop()
            self.sensor.destroy()
            self.sensor = None
        if self.video_writer is not None:
            self.video_writer.release()
            self.video_writer = None
        self.surface = None
        print("Done")

    @staticmethod
    def _parse_image(weak_self, image):
        self = weak_self()
        if not self:
            return
        image.convert(self.sensors[self.index][1])
        array = np.frombuffer(image.raw_data, dtype=np.dtype("uint8"))
        array = np.reshape(array, (image.height, image.width, 4))
        array = array[:, :, :3]
        array = array[:, :, ::-1]
        if self.video_frames is not None:
            self.video_frames.append(array.copy())
        if self.video_writer is None and len(self.video_frames) > 0:
            output_path = get_unique_filename()
            height, width = array.shape[:2]
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            self.video_writer = cv2.VideoWriter(output_path, fourcc, FRAME_RATE, (width, height))
        self.surface = pygame.surfarray.make_surface(array.swapaxes(0, 1))

class CollisionSensor(object):
    '''
    Attributes:
        - sensor: The CARLA collision sensor actor.
        - history: List of collision events with frame, intensity, and actor_type.
        - _parent: The parent vehicle actor to which the sensor is attached.

    Functions:
        - __init__(self, parent_actor): 
            Initializes the collision sensor and attaches it to the parent vehicle.
        - _on_collision(weak_self, event): 
            Handles collision events and logs them to the history with frame, intensity, and actor type.
        - cleanup(self): 
            Stops and destroys the collision sensor.
    '''
    def __init__(self, parent_actor):
        self.sensor = None
        self.history = []
        self._parent = parent_actor
        world = self._parent.get_world()
        bp = world.get_blueprint_library().find('sensor.other.collision')
        self.sensor = world.spawn_actor(bp, carla.Transform(), attach_to=self._parent)
        weak_self = weakref.ref(self)
        self.sensor.listen(lambda event: CollisionSensor._on_collision(weak_self, event))

    @staticmethod
    def _on_collision(weak_self, event):
        self = weak_self()
        if not self:
            return
        actor_type = ' '.join(event.other_actor.type_id.replace('_', '.').title().split('.')[1:])
        # print(f"Collision with {actor_type}")
        impulse = event.normal_impulse
        intensity = (impulse.x**2 + impulse.y**2 + impulse.z**2)**0.5
        self.history.append((event.frame, intensity, actor_type))

    def cleanup(self):
        if self.sensor is not None and self.sensor.is_alive:
            self.sensor.stop()
            self.sensor.destroy()
            self.sensor = None

class LaneInvasionSensor(object):
    '''
    Attributes:
        - sensor: The CARLA lane invasion sensor actor.
        - history: List of lane invasion events with frame and lane types.
        - _parent: The parent vehicle actor to which the sensor is attached.

    Functions:
        - __init__(self, parent_actor): 
            Initializes the lane invasion sensor and attaches it to the parent vehicle.
        - _on_lane_invasion(weak_self, event):
            Handles lane invasion events and logs them to the history.
        - cleanup(self): 
            Stops and destroys the lane invasion sensor.
    '''
    def __init__(self, parent_actor):
        self.sensor = None
        self.history = []
        self._parent = parent_actor
        world = self._parent.get_world()
        bp = world.get_blueprint_library().find('sensor.other.lane_invasion')
        self.sensor = world.spawn_actor(bp, carla.Transform(), attach_to=self._parent)
        weak_self = weakref.ref(self)
        self.sensor.listen(lambda event: LaneInvasionSensor._on_lane_invasion(weak_self, event))

    @staticmethod
    def _on_lane_invasion(weak_self, event):
        self = weak_self()
        if not self:
            return
        lane_types = set(x.type for x in event.crossed_lane_markings)
        text = ['%r' % str(x).split()[-1] for x in lane_types]
        # print(f"Lane invasion detected: Crossed {', '.join(text)}")
        self.history.append((event.frame, lane_types))

    def cleanup(self):
        if self.sensor is not None and self.sensor.is_alive:
            self.sensor.stop()
            self.sensor.destroy()
            self.sensor = None

class ObstacleDetector(object):
    '''
    Attributes:
        - sensor: The CARLA obstacle detection sensor actor.
        - history: List of obstacle detection events with frame, obstacle type, distance, and location.
        - _parent: The parent vehicle actor to which the sensor is attached.

    Functions:
        - __init__(self, parent_actor): 
            Initializes the obstacle detection sensor and attaches it to the parent vehicle.
        - _on_obstacle_detection(weak_self, event): 
            Handles obstacle detection events and logs them to the history.
        - cleanup(self): 
            Stops and destroys the obstacle detection sensor.
    '''
    def __init__(self, parent_actor):
        self.sensor = None
        self.history = []
        self._parent = parent_actor
        world = self._parent.get_world()
        bp = world.get_blueprint_library().find('sensor.other.obstacle')
        bp.set_attribute('distance', '50.0')
        bp.set_attribute('hit_radius', '0.5')
        bp.set_attribute('sensor_tick', '0.1')
        self.sensor = world.spawn_actor(
            bp,
            carla.Transform(carla.Location(x=2.0, z=1.0)),
            attach_to=self._parent
        )
        weak_self = weakref.ref(self)
        self.sensor.listen(lambda event: ObstacleDetector._on_obstacle_detection(weak_self, event))

    @staticmethod
    def _on_obstacle_detection(weak_self, event):
        self = weak_self()
        if not self:
            return
        obstacle = event.other_actor
        obstacle_type = ' '.join(obstacle.type_id.replace('_', '.').title().split('.')[1:])
        distance = event.distance
        obstacle_location = obstacle.get_location()
        vehicle_location = self._parent.get_location()
        relative_location = obstacle_location - vehicle_location
        # Debug print to confirm obstacle detection
        # print(f"Obstacle detected: {obstacle_type} at distance {distance:.2f}m, location (x={relative_location.x:.2f}, y={relative_location.y:.2f}, z={relative_location.z:.2f})")
        self.history.append((event.frame, obstacle_type, distance, relative_location))

    def cleanup(self):
        if self.sensor is not None and self.sensor.is_alive:
            self.sensor.stop()
            self.sensor.destroy()
            self.sensor = None

class IMUSensor(object):
    '''
    Attributes:
        - sensor: The CARLA IMU sensor actor.
        - acceleration: The latest acceleration data (x, y, z).
        - angular_velocity: The latest angular velocity data (x, y, z).
        - _parent: The parent vehicle actor to which the sensor is attached.

    Functions:
        - __init__(self, parent_actor): 
            Initializes the IMU sensor and attaches it to the parent vehicle.
        - _on_imu_data(weak_self, event): 
            Handles IMU data updates and stores acceleration and angular velocity.
        - cleanup(self): 
            Stops and destroys the IMU sensor.
    '''
    def __init__(self, parent_actor):
        self.sensor = None
        self.acceleration = None
        self.angular_velocity = None
        self._parent = parent_actor
        world = self._parent.get_world()
        bp = world.get_blueprint_library().find('sensor.other.imu')
        bp.set_attribute('sensor_tick', '0.1')
        self.sensor = world.spawn_actor(
            bp,
            carla.Transform(),
            attach_to=self._parent
        )
        weak_self = weakref.ref(self)
        self.sensor.listen(lambda event: IMUSensor._on_imu_data(weak_self, event))

    @staticmethod
    def _on_imu_data(weak_self, event):
        self = weak_self()
        if not self:
            return
        self.acceleration = event.accelerometer
        self.angular_velocity = event.gyroscope
        # Removed print statement to avoid terminal output
        # print(f"IMU Data: Acceleration (x={self.acceleration.x:.2f}, y={self.acceleration.y:.2f}, z={self.acceleration.z:.2f}), "
        #       f"Angular Velocity (x={self.angular_velocity.x:.2f}, y={self.angular_velocity.y:.2f}, z={self.angular_velocity.z:.2f})")

    def cleanup(self):
        if self.sensor is not None and self.sensor.is_alive:
            self.sensor.stop()
            self.sensor.destroy()
            self.sensor = None

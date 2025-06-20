from config import MAX_ERRORS_ALLOWED, Max_dis, Min_dis, Ref_Mass, Ref_Speed, Base_Threshold, Summary_Dir, MAX_SPEED, Stop_for
import os
from datetime import datetime
import carla

class Behaviour:
    '''
    Attributes:
        - vehicle: The Create_Vehicle object containing the CARLA vehicle actor.
        - sensors: List of CARLA sensor actors attached to the vehicle.
        - world_sensor: The World object containing sensor instances.
        - errors: Counter for errors when obstacle distance is less than Min_dis, collisions occur, or multiple lane invasions occur within a time window.
        - error_log: List of tuples storing error events (error_type, source).
        - summary_filepath: Path to the unique summary file for this simulation session.
        - lane_invasion_times: List of recent lane invasion events with simulation time and lane types.
        - stop_until_time: Simulation time until which the vehicle should remain stopped (None if not stopped).
        - stop_message_printed: Flag to track if stop message has been printed.
    '''
    def __init__(self, vehicle, world_sensor):
        self.world_sensor = world_sensor
        self.vehicle = vehicle
        self.sensors = None
        self.errors = 0
        self.error_log = []
        self.summary_filepath = self.get_unique_filename()
        self.lane_invasion_times = []
        self.stop_until_time = None
        self.stop_message_printed = False
        
        self.BASE_THRESHOLD = Base_Threshold
        self.REFERENCE_SPEED = Ref_Speed
        self.REFERENCE_MASS = Ref_Mass
        self.LANE_INVASION_WINDOW = 5.0
    
    def get_speed(self):
        velocity = self.vehicle.vehicle.get_velocity()
        current_speed = (velocity.x**2 + velocity.y**2 + velocity.z**2)**0.5
        return current_speed

    def get_speed_factor(self):
        current_speed = self.get_speed()
        current_speed = max(current_speed, 1.0)
        speed_factor = self.REFERENCE_SPEED / current_speed
        speed_factor = max(0.5, min(2.0, speed_factor))
        return speed_factor

    def get_mass_factor(self):
        current_mass = self.vehicle.vehicle.get_physics_control().mass
        mass_factor = current_mass / self.REFERENCE_MASS
        mass_factor = max(0.5, min(2.0, mass_factor))
        return mass_factor

    def get_object_type_factor(self, actor_type):
        actor_type = actor_type.lower()
        if 'vehicle' in actor_type or 'wall' in actor_type:
            return 0.8
        elif 'walker' in actor_type or 'pedestrian' in actor_type:
            return 1.5
        else:
            return 1.0

    def refresh_and_process_sensors(self):
        if self.sensors is None:
            self.sensors = self.vehicle.get_attached_sensors()

        sensor_data = {
            'collision_events': [],
            'lane_invasion_events': [],
            'obstacle_events': [],
            'imu_data': None
        }

        if self.world_sensor.collision_sensor.history:
            for frame, intensity, actor_type in self.world_sensor.collision_sensor.history:
                sensor_data['collision_events'].append({
                    'frame': frame,
                    'intensity': intensity,
                    'actor_type': actor_type
                })
            self.world_sensor.collision_sensor.history.clear()

        if self.world_sensor.lane_invasion_sensor.history:
            for frame, lane_types in self.world_sensor.lane_invasion_sensor.history:
                sensor_data['lane_invasion_events'].append({
                    'frame': frame,
                    'lane_types': [str(lt) for lt in lane_types]
                })
            print(f"Lane invasions detected: {sensor_data['lane_invasion_events']}")
            self.world_sensor.lane_invasion_sensor.history.clear()

        if self.world_sensor.obstacle_detector.history:
            for frame, obstacle_type, distance, location in self.world_sensor.obstacle_detector.history:
                sensor_data['obstacle_events'].append({
                    'frame': frame,
                    'obstacle_type': obstacle_type,
                    'distance': distance,
                    'location': {'x': location.x, 'y': location.y, 'z': location.z}
                })
        
        if hasattr(self.world_sensor, 'imu_sensor') and self.world_sensor.imu_sensor and self.world_sensor.imu_sensor.acceleration is not None:
            acceleration = self.world_sensor.imu_sensor.acceleration
            angular_velocity = self.world_sensor.imu_sensor.angular_velocity
            sensor_data['imu_data'] = {
                'acceleration': {
                    'x': acceleration.x,
                    'y': acceleration.y,
                    'z': acceleration.z,
                    'magnitude': (acceleration.x**2 + acceleration.y**2 + acceleration.z**2)**0.5
                },
                'angular_velocity': {
                    'x': angular_velocity.x,
                    'y': angular_velocity.y,
                    'z': angular_velocity.z,
                    'magnitude': (angular_velocity.x**2 + angular_velocity.y**2 + angular_velocity.z**2)**0.5
                }
            }

        return sensor_data

    def get_unique_filename(self):
        if not os.path.exists(Summary_Dir):
            os.makedirs(Summary_Dir)

        index = 0
        while True:
            filename = f"Summary_{index}.txt"
            filepath = os.path.join(Summary_Dir, filename)
            if not os.path.exists(filepath):
                return filepath
            index += 1

    def write_summary_file(self):
        now = datetime.now()
        day = now.day
        if 10 <= day % 100 <= 20:
            suffix = "th"
        else:
            suffix = {1: "st", 2: "nd", 3: "rd"}.get(day % 10, "th")
        date_str = f"{day}{suffix} {now.strftime('%b %Y')}"
        time_str = now.strftime("%I:%M %p")

        with open(self.summary_filepath, 'w') as f:
            f.write(f"Date: {date_str}\n")
            f.write(f"Time: {time_str}\n")
            f.write("---------------------------------\n")
            f.write(f"{'id':<10} {'Error':<30} {'Source':<30}\n")

            for idx, (error_type, source) in enumerate(self.error_log, start=1):
                f.write(f"{idx:<10} {error_type:<30} {source:<30}\n")

        print(f"Summary file updated: {self.summary_filepath}")

    def Monitor(self):
        sensor_data = self.refresh_and_process_sensors()

        speed_factor = self.get_speed_factor()
        mass_factor = self.get_mass_factor()

        current_time = self.world_sensor.simulation_time
        if sensor_data['lane_invasion_events']:
            for event in sensor_data['lane_invasion_events']:
                lane_types = event['lane_types']
                if 'NONE' not in lane_types:
                    self.lane_invasion_times.append({
                        'time': current_time,
                        'lane_types': lane_types
                    })

            self.lane_invasion_times = [
                inv for inv in self.lane_invasion_times
                if current_time - inv['time'] <= self.LANE_INVASION_WINDOW
            ]

            if len(self.lane_invasion_times) >= 2:
                source = ', '.join(self.lane_invasion_times[-1]['lane_types'])
                print(f"***** Multiple Lane Invasions Detected: {source} *****")
                self.error_log.append(("Lane Invasion", source))
                self.errors += 1
                self.write_summary_file()
                self.lane_invasion_times.clear()

        if sensor_data['collision_events']:
            for collision in sensor_data['collision_events']:
                intensity = collision['intensity']
                actor_type = collision['actor_type']
                object_type_factor = self.get_object_type_factor(actor_type)
                
                dynamic_threshold = self.BASE_THRESHOLD * speed_factor * mass_factor * object_type_factor
                print(f"Collision detected with {actor_type} - intensity {intensity:.2f} (Dynamic Threshold: {dynamic_threshold:.2f})")
                
                self.error_log.append(("Collision", actor_type))
                self.errors += 1
                self.write_summary_file()

                if intensity > dynamic_threshold:
                    print("***** DANGEROUS COLLISION DETECTED *****")
                    self.error_log.append(("Dangerous Collision", actor_type))
                    self.errors += 1
                    self.write_summary_file()

        if sensor_data['obstacle_events']:
            recent_obstacle = sensor_data['obstacle_events'][-1]
            obstacle_type = recent_obstacle['obstacle_type']
            distance = recent_obstacle['distance']
            
            if distance < Min_dis and self.get_speed() != 0:
                print("***** Alarm: Watch Out *****")
                self.error_log.append(("Obstacle Proximity", obstacle_type))
                self.errors += 1
                self.write_summary_file()
            elif distance < Max_dis:
                print("***** Alarm: Watch Out *****")
            else:
                print(f"{obstacle_type} at distance {distance:.2f}m")
            
            self.world_sensor.obstacle_detector.history.clear()

        self.Controlling()

    def Controlling(self):
        # Check if vehicle is stopped due to max errors
        if self.stop_until_time is not None and self.world_sensor.simulation_time < self.stop_until_time:
            if not self.stop_message_printed:
                remaining_time = self.stop_until_time - self.world_sensor.simulation_time
                print(f"Vehicle stopped for {remaining_time:.1f} seconds")
                self.stop_message_printed = True
            control = carla.VehicleControl(throttle=0.0, brake=1.0, steer=0.0)
            self.vehicle.vehicle.apply_control(control)
            return

        # Reset stop message flag when stop period ends
        if self.stop_until_time is not None and self.world_sensor.simulation_time >= self.stop_until_time:
            print("Vehicle can now move")
            self.stop_until_time = None
            self.stop_message_printed = False

        if self.errors >= MAX_ERRORS_ALLOWED:
            print("***** Errors reach max *****")
            control = carla.VehicleControl(throttle=0.0, brake=1.0, steer=0.0)
            self.vehicle.vehicle.apply_control(control)
            self.stop_until_time = self.world_sensor.simulation_time + Stop_for
            # Optionally reset errors and log (uncomment if desired)
            # self.error_log.clear()
            self.errors = 0
        else:
            print(f"Errors = {self.errors}")

from start_carla import Start
Start()

import os
import time
import carla
import pygame
from Key import *
from world import World as CarlaWorld
from vehicles import Create_Vehicle
from sensors import World
from config import RESOLUTION, Inc_Speed, MAX_SPEED, BASE_SPEED, refresh_monitoring
from video_recording import setup_video_recording, save_video
from driving import Behaviour

# Verify CARLA version
version = getattr(carla, '__version__', 'Unknown')
print(f"Using CARLA version: {version}")

def get_all_map_layers():
    """Return a list of all specific map layer names (excluding NONE and All)."""
    return ["Buildings", "Decals", "Foliage", "Ground", "ParkedVehicles", "Particles", "Props", "Walls"]

def main():
    world_obj = None
    vehicle = None
    camera = None
    world_sensor = None
    pygame_display = None
    clock = None
    video_frames = []
    stop_message_printed = False

    try:
        print("Initializing simulation...")
        world_obj = CarlaWorld()
        print("Waiting for world to load...")
        time.sleep(2.0)
        world_obj.world.tick()

        print("Spawning vehicle...")
        vehicle = Create_Vehicle(world_obj)
        if not vehicle.vehicle.is_alive:
            raise RuntimeError("Failed to spawn vehicle")

        print("Setting up RGB camera...")
        blueprint_library = world_obj.blueprint_library
        camera_bp = blueprint_library.find('sensor.camera.rgb')
        camera_bp.set_attribute('image_size_x', str(RESOLUTION[0]))
        camera_bp.set_attribute('image_size_y', str(RESOLUTION[1]))
        camera = world_obj.world.spawn_actor(
            camera_bp,
            carla.Transform(carla.Location(x=1.5, z=1.4)),
            attach_to=vehicle.vehicle)
        print("Camera spawned")

        print("Setting up the spectator...")
        spectator = world_obj.world.get_spectator()
        transform = vehicle.vehicle.get_transform()
        spectator.set_transform(carla.Transform(
            transform.location + carla.Location(x=-5, z=3),
            carla.Rotation(pitch=-20, yaw=transform.rotation.yaw)
        ))
        print("Spectator set")

        print("Initializing Pygame...")
        pygame.init()
        pygame_display = pygame.display.set_mode(RESOLUTION, pygame.HWSURFACE | pygame.DOUBLEBUF)
        pygame.display.set_caption("CARLA Manual Control")
        clock = pygame.time.Clock()
        font = pygame.font.SysFont("arial", 24, bold=True)
        print("Pygame initialized")

        setup_video_recording()

        print("Initializing sensors...")
        world_sensor = World(world_obj.world, vehicle.vehicle, camera, video_frames)
        behaviour_obj = Behaviour(vehicle, world_sensor)

        print("Waiting for world tick to ensure sensor attachment...")
        world_obj.world.tick()
        time.sleep(0.1)
        
        print("\nRefreshing attached sensors after World initialization...")
        behaviour_obj.sensors = vehicle.get_attached_sensors()

        print("Controls:")
        print("- Up arrow: Drive (toggle direction with M)")
        print("- Z: Increase speed, X: Decrease speed")
        print("- Space: Stop the car")
        print("- Q: Toggle camera view")
        print("- M: Toggle forward/backward direction")
        print("- P: Toggle autopilot/manual control")
        print("- ESC: Quit")

        # Vehicle control variables
        control = carla.VehicleControl()
        steer_cache = 0.0
        target_speed = 0
        base_speed = BASE_SPEED
        gain = 1
        throttle = 0.0
        is_up_held = False
        is_moving_forward = True
        autopilot_enabled = False
        last_sensor_refresh = 0.0
        last_refresh = 0.0

        while True:
            clock.tick_busy_loop(30)
            world_obj.world.tick()

            # Check if vehicle is stopped due to max errors
            if behaviour_obj.stop_until_time is not None and world_sensor.simulation_time < behaviour_obj.stop_until_time:
                if not stop_message_printed:
                    remaining_time = behaviour_obj.stop_until_time - world_sensor.simulation_time
                    print(f"Ignoring inputs: vehicle stopped for {remaining_time:.1f} seconds")
                    stop_message_printed = True
                control = carla.VehicleControl(throttle=0.0, brake=1.0, steer=0.0)
                vehicle.vehicle.apply_control(control)
                continue  # Skip user input processing

            # Reset stop message flag when stop period ends
            if behaviour_obj.stop_until_time is not None and world_sensor.simulation_time >= behaviour_obj.stop_until_time:
                stop_message_printed = False

            for event in pygame.event.get():
                if event.type == pygame.QUIT or (event.type == pygame.KEYUP and event.key == Key_ESC):
                    return
                
                elif event.type == pygame.KEYDOWN:
                    if event.key == Key_Toggle_View:
                        world_sensor.camera_manager.toggle_view()
                    
                    elif event.key == Key_Toggle_Driction:
                        is_moving_forward = not is_moving_forward
                        control.reverse = not is_moving_forward
                        print(f"Toggled to {'forward' if is_moving_forward else 'backward'}")
                
                    elif event.key == Key_Move_Forward:
                        is_up_held = True
                        target_speed = base_speed 
                        print(f"Driving {'forward' if is_moving_forward else 'backward'} at {target_speed} km/h")
                
                    elif event.key == Key_Toggle_Control:
                        autopilot_enabled = not autopilot_enabled
                        vehicle.vehicle.set_autopilot(autopilot_enabled)
                        print(f"Autopilot {'Enabled' if autopilot_enabled else 'Disabled'}")
                
            keys = pygame.key.get_pressed()

            if not autopilot_enabled:
                if keys[Key_Move_Forward]:
                    throttle = min(throttle + 0.01, 1.0)
                else:
                    throttle = max(throttle - 0.01, 0.0)

                if keys[Key_Inc_Speed]:
                    base_speed += Inc_Speed
                    if is_up_held:
                        target_speed = base_speed if is_moving_forward else -base_speed
                    base_speed = min(MAX_SPEED, base_speed)
                    print(f"Speed increased to {base_speed} km/h")                    
                    pygame.time.wait(200)
                
                if keys[Key_Dec_Speed]:
                    base_speed -= Inc_Speed
                    if is_up_held:
                        target_speed = base_speed if is_moving_forward else -base_speed
                    base_speed = min(MAX_SPEED, base_speed)
                    print(f"Speed decreased to {base_speed} km/h")
                    pygame.time.wait(200)

                if keys[Key_Move_Stop]:
                    target_speed = 0
                    print("Stopped driving")

                velocity = vehicle.vehicle.get_velocity()
                current_speed = (velocity.x**2 + velocity.y**2 + velocity.z**2)**0.5 * 3.6
                speed_error = target_speed - current_speed
                control.throttle = min(max(gain * speed_error, 0.0), 1.0)
                control.brake = min(max(-gain * speed_error, 0.0), 1.0)

                control.hand_brake = keys[Key_Move_Stop]
                
                steer_increment = 5e-4 * clock.get_time()
                if keys[Key_Move_Left]:
                    steer_cache -= steer_increment
                elif keys[Key_Move_Right]:
                    steer_cache += steer_increment
                else:
                    steer_cache = 0.0
                steer_cache = min(0.7, max(-0.7, steer_cache))
                control.steer = round(steer_cache, 1)

                vehicle.vehicle.apply_control(control)

            current_time = time.time()
            if current_time - last_sensor_refresh >= 1.0:
                sensor_data = behaviour_obj.refresh_and_process_sensors()
                
                if sensor_data['collision_events']:
                    print("Collisions detected:", sensor_data['collision_events'])
                
                if sensor_data['lane_invasion_events']:
                    print("Lane invasions detected:", sensor_data['lane_invasion_events'])
                
                last_sensor_refresh = current_time

            current_time = time.time()
            if current_time - last_refresh >= refresh_monitoring:
                last_refresh = current_time
                behaviour_obj.Monitor()
                
            last_obstacle_text = ""
            if 'obstacle_events' in sensor_data and sensor_data['obstacle_events']:
                recent_obstacle = sensor_data['obstacle_events'][-1]
                obstacle_type = recent_obstacle['obstacle_type']
                distance = recent_obstacle['distance']
                location = recent_obstacle['location']
                last_obstacle_text = f"Obstacle: {obstacle_type} {distance:.1f}m (x={location['x']:.1f}, y={location['y']:.1f})"

            world_sensor.tick(clock)
            world_sensor.render(pygame_display)

            velocity = vehicle.vehicle.get_velocity()
            current_speed = (velocity.x**2 + velocity.y**2 + velocity.z**2)**0.5 * 3.6
            current_speed = min(MAX_SPEED, current_speed)

            speed_text = f"Speed = {current_speed:.2f} km/h"
            fps_text = f"FPS = {clock.get_fps():.1f}"
            mode_text = f"Mode: {'Autopilot' if autopilot_enabled else 'Manual'} Control"
            
            text_surface = font.render(speed_text, True, (255, 255, 255))
            fps_surface = font.render(fps_text, True, (255, 255, 255))
            mode_surface = font.render(mode_text, True, (255, 255, 255))
            
            text_outline = font.render(speed_text, True, (0, 0, 0))
            fps_outline = font.render(fps_text, True, (0, 0, 0))
            mode_outline = font.render(mode_text, True, (0, 0, 0))

            pygame_display.blit(text_outline, (8, 8))
            pygame_display.blit(text_outline, (12, 8))
            pygame_display.blit(text_outline, (8, 12))
            pygame_display.blit(text_outline, (12, 12))
            pygame_display.blit(text_surface, (10, 10))

            pygame_display.blit(fps_outline, (8, 38))
            pygame_display.blit(fps_outline, (12, 38))
            pygame_display.blit(fps_outline, (8, 42))
            pygame_display.blit(fps_outline, (12, 42))
            pygame_display.blit(fps_surface, (10, 40))

            pygame_display.blit(mode_outline, (8, 68))
            pygame_display.blit(mode_outline, (12, 68))
            pygame_display.blit(mode_outline, (8, 72))
            pygame_display.blit(mode_outline, (12, 72))
            pygame_display.blit(mode_surface, (10, 70))

            pygame.display.flip()

    except Exception as e:
        print(f"\nError: {e}")
        print("Ensure the CARLA server is running on localhost:2000")
    finally:
        print("Cleaning up...")
        try:
            if world_sensor is not None:
                save_video(video_frames, world_sensor.camera_manager.video_writer)
                world_sensor.destroy()
                world_sensor = None
            if camera is not None and camera.is_alive:
                camera.stop()
                camera.destroy()
                camera = None
            if vehicle is not None:
                vehicle.cleanup()
                vehicle = None
            if world_obj is not None:
                world_obj.cleanup()
                world_obj = None
            if pygame_display is not None:
                pygame.quit()
                pygame_display = None
            if world_obj is not None and world_obj.world is not None:
                world_obj.world.tick()
        except Exception as e:
            print(f"Error during cleanup: {e}")
        print("Cleanup complete.")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('\nCancelled by user.')
    finally:
        print('Cleaning up...')

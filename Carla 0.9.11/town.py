from start_carla import Start
Start()

import carla
import numpy as np
import matplotlib.pyplot as plt
import os

def plot_map(town_name, topology, spawn_points, output_dir="town_plots"):
    """
    Plot the map topology and spawn points for a given town, saving the plot as an image.
    Labels each spawn point with its index (SPAWN_POINT_INDEX).

    Args:
        town_name (str): Name of the town (e.g., 'Town01').
        topology (list): List of (start_waypoint, end_waypoint) tuples from map.get_topology().
        spawn_points (list): List of carla.Transform objects representing spawn points.
        output_dir (str): Directory to save the plot images.
    """
    # Create output directory if it doesn't exist
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # Initialize the plot
    plt.figure(figsize=(10, 10))
    plt.title(f"{town_name} Map with Spawn Points", fontsize=16)
    plt.xlabel("X Coordinate (meters)", fontsize=12)
    plt.ylabel("Y Coordinate (meters)", fontsize=12)
    plt.grid(True, linestyle='--', alpha=0.7)

    # Plot the road topology (lines connecting waypoints)
    for start_wp, end_wp in topology:
        start_loc = start_wp.transform.location
        end_loc = end_wp.transform.location
        plt.plot(
            [start_loc.x, end_loc.x],
            [start_loc.y, end_loc.y],
            color='gray',
            linewidth=2,
            label='Roads' if 'Roads' not in plt.gca().get_legend_handles_labels()[1] else ""
        )

    # Plot spawn points as red dots and label them with their indices
    for idx, spawn_point in enumerate(spawn_points):
        x, y = spawn_point.location.x, spawn_point.location.y
        # Plot the spawn point as a red dot
        plt.scatter(x, y, color='red', s=50, label='Spawn Points' if idx == 0 else "", zorder=5)
        # Add a label with the spawn point index
        plt.text(
            x + 5,  # Offset the label slightly to the right
            y + 5,  # Offset the label slightly above
            str(idx),
            fontsize=8,
            color='black',
            ha='left',
            va='bottom',
            bbox=dict(facecolor='white', alpha=0.7, edgecolor='none', pad=1),
            zorder=10
        )

    # Add legend and adjust layout
    plt.legend()
    plt.tight_layout()

    # Save the plot
    output_path = os.path.join(output_dir, f"{town_name}.png")
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Saved plot for {town_name} at {output_path}")

def main():
    # Connect to CARLA server
    client = carla.Client('localhost', 2000)
    client.set_timeout(50.0)

    # List of all towns to process
#     towns = ['Town01', 'Town02', 'Town03', 'Town04', 'Town05', 'Town06', 'Town07', 'Town10']
    towns = ['Town05', 'Town06', 'Town07', 'Town10']

    for town in towns:
        try:
            print(f"Loading {town}...")
            world = client.load_world(town)
            
            # Wait for the world to load
            world.tick()

            # Get the map and its topology
            carla_map = world.get_map()
            topology = carla_map.get_topology()
            spawn_points = carla_map.get_spawn_points()

            print(f"{town} has {len(spawn_points)} spawn points.")

            # Plot the map with spawn points
            plot_map(town, topology, spawn_points)

        except Exception as e:
            print(f"Error processing {town}: {e}")
        finally:
            # Clean up by reloading the world to avoid memory issues
            client.reload_world()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("Script interrupted by user.")
    except Exception as e:
        print(f"An error occurred: {e}")
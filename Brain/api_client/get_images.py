import os
import requests


def get_users_for_car(car_id):
    """
    Fetch the list of user IDs for a specific car from your API.
    """
    api_url = f'http://localhost:5000/api/vehicles/{car_id}/usersID'  # Make sure this matches your server route

    try:
        response = requests.get(api_url)
        response.raise_for_status()  # This will throw an error if the status code is not 2xx

        data = response.json()

        if data.get('success'):
            users = data.get('users', [])
            return users
        else:
            print(f"API error: {data.get('message', 'Unknown error')}")
            return []

    except requests.RequestException as e:
        print(f"Request failed: {e}")
        return []


def download_user_image(car_id, user_id):
    """
    Downloads the image for a single user.
    
    The API expects a filename in the format `user_id.jpeg`,
    and returns the image file.
    """
    base_url = "http://localhost:5000"  # Change this if your server is hosted elsewhere
    filename = f"{user_id}.jpeg"  # Construct filename using the user_id
    image_url = f"{base_url}/users/images/{filename}"
    
    # Create a local folder for the car if it doesn't exist
    download_folder = f"./Models/python_code_exec/access_control/images"
    os.makedirs(download_folder, exist_ok=True)
    
    # Request the image from the API
    image_response = requests.get(image_url)
    if image_response.status_code == 200:
        file_path = os.path.join(download_folder, filename)
        with open(file_path, "wb") as f:
            f.write(image_response.content)
        print(f"Downloaded {filename} for user {user_id}")
    else:
        print(f"Failed to download {filename} for user {user_id}, Status code: {image_response.status_code}")


# Main function to handle the process
def download_images_for_car(carID):
        users = get_users_for_car(carID)
        if users:
            # Download images for each user in the car
            for userID in users:
                print(f"Downloading images for user {userID} in car {carID}...")
                download_user_image(carID, userID)
        else:
            print(f"No users found for carID {carID}")

# # Example usage
# download_images_for_car("5YJ3E1EA7HF000314")

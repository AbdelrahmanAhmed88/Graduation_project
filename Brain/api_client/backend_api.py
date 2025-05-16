import requests

# Base URL for your Node.js API
BASE_URL = "http://localhost:5000/api"

# Function to validate NFC ID and Vehicle ID
def validate_nfc(nfc_id, vehicle_id):
    url = f"{BASE_URL}/nfcs/{nfc_id}/{vehicle_id}"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            print(f"NFC ID {nfc_id} found for Vehicle ID {vehicle_id}.")
            return response.json()  # You can return the data if needed
        else:
            print(f"NFC ID {nfc_id} not found for Vehicle ID {vehicle_id}.")
            return None
    except requests.exceptions.RequestException as e:
        print(f"Error validating NFC ID: {e}")
        return None

# Function to fetch user data by user_id
def get_user_data(user_id):
    url = f"{BASE_URL}/users/{user_id}"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            # print(f"User data for user ID {user_id}: {response.json()}")
            return response.json()  # You can return the data if needed
        else:
            print(f"User with ID {user_id} not found.")
            return None
    except requests.exceptions.RequestException as e:
        print(f"Error fetching user data: {e}")
        return None

# Function to authenticate the user based on the NFC and face validation
def authenticate_user(nfc_id, vehicle_id, user_id):
    # First validate the NFC ID
    nfc_validation = validate_nfc(nfc_id, vehicle_id)
    
    if nfc_validation:
        # If NFC is valid, fetch the user data
        user_data = get_user_data(user_id)
        
        if user_data:
            print(f"Authentication successful for User: {user_data['name']}")
            # Additional logic for successful authentication
            return True
        else:
            print("Authentication failed: User not found.")
            return False
    else:
        print("Authentication failed: NFC ID not valid.")
        return False


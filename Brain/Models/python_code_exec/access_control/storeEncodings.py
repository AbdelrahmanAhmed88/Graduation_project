import os
import pickle
import cv2
import face_recognition
from simple_facerec import SimpleFacerec

# File to store encodings   r"E:/engeneering/graduation project/project/backend-nodejs/python_code_exec/python/access_control/encodings.pkl"
encodings_file = f"./Models/python_code_exec/access_control//encodings.pkl" 
# Load existing encodings if the file exists
if os.path.exists(encodings_file):
    with open(encodings_file, "rb") as f:
        known_face_encodings, known_face_names = pickle.load(f)
else:
    known_face_encodings, known_face_names = [], []

# Initialize SimpleFacerec
sfr = SimpleFacerec()

# Load new images from the "images" folder 
# old path 
image_path =  f"./Models/python_code_exec/access_control/images"
for img_name in os.listdir(image_path):
    img_path = os.path.join(image_path, img_name)
    img = cv2.imread(img_path)

    # Detect face encodings
    face_encodings = face_recognition.face_encodings(img)

    if face_encodings:
        encoding = face_encodings[0]  # Take the first detected face
        name = os.path.splitext(img_name)[0]  # Use filename as the person's name

        # Check if this face is already stored
        if name not in known_face_names:
            known_face_encodings.append(encoding)
            known_face_names.append(name)
            print(f"New face added: {name}")

# Save updated encodings
with open(encodings_file, "wb") as f:
    pickle.dump((known_face_encodings, known_face_names), f)

print(f"Encodings updated and saved to {encodings_file}")
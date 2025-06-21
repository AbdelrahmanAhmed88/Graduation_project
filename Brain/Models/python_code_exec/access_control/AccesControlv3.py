import os
import cv2
import face_recognition
import time
from ultralytics import YOLO
from simple_facerec import SimpleFacerec

# Step 1: Calculate face encodings from images in the "images" folder
def calculate_face_encodings(image_folder):
    known_face_encodings = []
    known_face_names = []

    for img_name in os.listdir(image_folder):
        img_path = os.path.join(image_folder, img_name)
        img = cv2.imread(img_path)

        # Detect face encodings
        face_encodings = face_recognition.face_encodings(img)

        if face_encodings:
            encoding = face_encodings[0]  # Take the first detected face
            name = os.path.splitext(img_name)[0]  # Use filename as the person's name

            # Add to known faces
            known_face_encodings.append(encoding)
            known_face_names.append(name)
            

    return known_face_encodings, known_face_names

# Step 2: Initialize SimpleFacerec with calculated encodings r"E:/engeneering/graduation project/project/Brain/Models/python_code_exec/python/access_control/images/"
image_folder = f"./Models/python_code_exec/access_control/images/"  # Folder containing images for face encodings
known_face_encodings, known_face_names = calculate_face_encodings(image_folder)

sfr = SimpleFacerec()
sfr.known_face_encodings = known_face_encodings
sfr.known_face_names = known_face_names

# Step 3: Load anti-spoofing model r"E:/engeneering/graduation project/project/Brain/Models/python_code_exec/python/access_control/best.pt"
antispoofing_model = YOLO(f"./Models/python_code_exec/access_control/best.pt")

# Step 4: Open the camera
cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
cap.set(3, 640)
cap.set(4, 480)

# Allow the camera to warm up
time.sleep(2)

# Recognition count dictionary
recognition_count = {}

try:
    while True:
        success, frame = cap.read()
        if not success:
            break

        # Step 5: Anti-spoofing detection
        spoof_results = antispoofing_model(frame, stream=True, verbose=False)
        real_faces = []

        for r in spoof_results:
            for box in r.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                conf = round(float(box.conf[0]), 2)
                cls = int(box.cls[0])

                if conf > 0.6 and cls == 1:  # Class 1 = real face
                    real_faces.append((x1, y1, x2, y2))

        # Step 6: Face recognition for real faces
        for (x1, y1, x2, y2) in real_faces:
            face_region = frame[y1:y2, x1:x2]
            face_locations, face_names = sfr.detect_known_faces(face_region)

            for _, name in zip(face_locations, face_names):
                recognition_count[name] = recognition_count.get(name, 0) + 1

                if recognition_count[name] >= 5:
                    print(f"{name}")
                    
                    # Clean exit
                    cap.release()
                    cv2.destroyAllWindows()
                    exit()

except Exception as e:
    print(f"Error: {e}")

finally:
    cap.release()
    cv2.destroyAllWindows()
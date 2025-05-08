import cv2
import pickle
import time
from ultralytics import YOLO
from simple_facerec import SimpleFacerec
import time

# Start time
start_time = time.time()

# Load stored encodings
encodings_file = "encodings.pkl"
with open(encodings_file, "rb") as f:
    known_face_encodings, known_face_names = pickle.load(f)

# Initialize SimpleFacerec with stored encodings
sfr = SimpleFacerec()
sfr.known_face_encodings = known_face_encodings
sfr.known_face_names = known_face_names

# Load antispoofing model
antispoofing_model = YOLO(r"E:/engeneering/graduation project/project/backend-nodejs/python_code_exec/python/access_control/best.pt")

# Camera setup
cap = cv2.VideoCapture(0,cv2.CAP_DSHOW)
cap.set(3, 640)
cap.set(4, 480)

# Recognition count dictionary
recognition_count = {}

try:
    while True:
        success, frame = cap.read()
        if not success:
            print("Failed to read from the camera. Exiting...")
            break

        # Antispoofing Detection
        spoof_results = antispoofing_model(frame, stream=True, verbose=False)
        real_faces = []

        for r in spoof_results:
            for box in r.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                conf = round(float(box.conf[0]), 2)
                cls = int(box.cls[0])

                if conf > 0.6 and cls == 1:  # Class 1 = real face
                    real_faces.append((x1, y1, x2, y2))

        # Face Recognition for Real Faces
        for (x1, y1, x2, y2) in real_faces:
            face_region = frame[y1:y2, x1:x2]
            face_locations, face_names = sfr.detect_known_faces(face_region)

            for _, name in zip(face_locations, face_names):
                recognition_count[name] = recognition_count.get(name, 0) + 1

                if recognition_count[name] >= 5:
                    print(name)
                    cap.release()
                    cv2.destroyAllWindows()
                #     # End time
                #     end_time = time.time()
                #    # Calculate time taken
                #     time_taken = end_time - start_time
                #     print(f"Time taken: {time_taken} seconds")  
                #     exit()
                  

except Exception as e:
    print(f"An error occurred: {e}")
finally:
    cap.release()
    cv2.destroyAllWindows()
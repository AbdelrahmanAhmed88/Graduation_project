import cv2
import mediapipe as mp
import numpy as np
import tensorflow as tf
import time
import sounddevice as sd
from scipy.spatial import distance as dist
from cv2 import solvePnP, Rodrigues

EMOTION_MODEL_PATH = "./emotion_face_mobilNetv6.h5"  
EMOTION_LABELS = ['Angry', 'Fear', 'Happy', 'Neutral', 'Sad'] 

# Critical emotions to print to console
CRITICAL_EMOTIONS = ['Fear', 'Sad']

# ===================== Sound Alert ====================
def play_tone(freq, duration, samplerate=44100):
    t = np.linspace(0, duration, int(samplerate * duration), endpoint=False)
    waveform = 0.5 * np.sin(2 * np.pi * freq * t)
    sd.play(waveform, samplerate)
    sd.wait()

# ===================== MediaPipe Setup ====================
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    refine_landmarks=True,
    max_num_faces=1,
    min_detection_confidence=0.6,  # Increased for robustness
    min_tracking_confidence=0.6
)
mp_drawing = mp.solutions.drawing_utils
drawing_spec = mp_drawing.DrawingSpec(thickness=1, circle_radius=1, color=(255, 255, 255))

# ===================== Landmark Indexes ====================
LEFT_IRIS = [474, 475, 476, 477]
RIGHT_IRIS = [469, 470, 471, 472]
LEFT_EYE = [33, 133]
RIGHT_EYE = [362, 263]
NOSE = 1
LEFT_EYE_EAR = [33, 160, 158, 133, 153, 144]
RIGHT_EYE_EAR = [362, 385, 387, 263, 373, 380]
MOUTH = [61, 81, 13, 311, 291, 402, 14, 178]  

# ===================== Thresholds ====================
EAR_THRESH = 0.15
WAIT_TIME = 1.25
YAWN_THRESH = 0.45
YAWN_TIME_THRESH = 1.2
WARNING_THRESHOLD = 3  
PITCH_LOOKING_DOWN_THRESHOLD = 35  # degrees
LOOKING_DOWN_DURATION_THRESHOLD = 2  # seconds

# ===================== Timers ====================
distraction_start_time = None

# ===================== EAR/MAR Calculations ====================
def calculate_ear(eye):
    vertical_1 = np.linalg.norm(np.array(eye[1]) - np.array(eye[5]))
    vertical_2 = np.linalg.norm(np.array(eye[2]) - np.array(eye[4]))
    horizontal = np.linalg.norm(np.array(eye[0]) - np.array(eye[3]))
    return (vertical_1 + vertical_2) / (2.0 * horizontal)

def calculate_mar(mouth):
    vertical_1 = np.linalg.norm(np.array(mouth[1]) - np.array(mouth[7]))
    vertical_2 = np.linalg.norm(np.array(mouth[2]) - np.array(mouth[6]))
    vertical_3 = np.linalg.norm(np.array(mouth[3]) - np.array(mouth[5]))
    horizontal = np.linalg.norm(np.array(mouth[0]) - np.array(mouth[4]))
    return (vertical_1 + vertical_2 + vertical_3) / (3.0 * horizontal)

# ===================== Head Pose Estimation ====================
def get_head_pose(landmarks, w, h):
    image_points = np.array([
        (landmarks[1].x * w, landmarks[1].y * h),     # Nose tip
        (landmarks[33].x * w, landmarks[33].y * h),   # Left eye inner
        (landmarks[263].x * w, landmarks[263].y * h), # Right eye inner
        (landmarks[61].x * w, landmarks[61].y * h),   # Mouth left
        (landmarks[291].x * w, landmarks[291].y * h), # Mouth right
        (landmarks[199].x * w, landmarks[199].y * h)  # Chin
    ], dtype='double')

    model_points = np.array([
        (0.0, 0.0, 0.0),             # Nose
        (-30.0, -30.0, -30.0),       # Left eye
        (30.0, -30.0, -30.0),        # Right eye
        (-40.0, 30.0, -30.0),        # Mouth left
        (40.0, 30.0, -30.0),         # Mouth right
        (0.0, 70.0, -50.0)           # Chin
    ])

    focal_length = w
    center = (w / 2, h / 2)
    camera_matrix = np.array([
        [focal_length, 0, center[0]],
        [0, focal_length, center[1]],
        [0, 0, 1]
    ], dtype='double')
    dist_coeffs = np.zeros((4, 1))

    success, rotation_vector, _ = solvePnP(model_points, image_points, camera_matrix, dist_coeffs)
    if not success:
        return None

    rotation_mat, _ = Rodrigues(rotation_vector)
    pitch = np.arcsin(-rotation_mat[2][1]) * 180 / np.pi
    return pitch

# ===================== Face Cropping ====================
def crop_face(frame, face_landmarks, w, h):
    try:
        landmarks = face_landmarks.landmark
        # Get key landmarks for bounding box
        x_coords = [landmark.x * w for landmark in landmarks]
        y_coords = [landmark.y * h for landmark in landmarks]
        
        x_min = max(0, int(min(x_coords) - 50))  
        x_max = min(w, int(max(x_coords) + 50))
        y_min = max(0, int(min(y_coords) - 70))  
        y_max = min(h, int(max(y_coords) + 50))
        
        # Ensure valid crop dimensions
        if x_max <= x_min or y_max <= y_min:
            return None
        
        # Crop the face
        cropped = frame[y_min:y_max, x_min:x_max]
        if cropped.size == 0:
            return None
        return cropped
    except Exception as e:
        print(f"Error cropping face: {e}")
        return None

# ===================== Emotion Model Handling ====================
class ModelSwitcher:
    def __init__(self, emotion_model_path):
        self.emotion_model_path = emotion_model_path
        self.emotion_model = None
        self.current_task = None

    def load_emotion_model(self):
        if self.current_task != "emotion":
            print(f"Loading emotion model from {self.emotion_model_path}")
            try:
                self.emotion_model = tf.keras.models.load_model(self.emotion_model_path)
                self.current_task = "emotion"
            except Exception as e:
                print(f"Failed to load emotion model: {e}")
                self.emotion_model = None
        return self.emotion_model

def preprocess_emotion(image):
    # Preprocessing for MobileNetV2: 224x224 RGB images, [0, 1] normalization
    image = cv2.resize(image, (224, 224))  # Resize to 224x224
    image = image / 255.0  # Normalize to [0, 1]
    return np.expand_dims(image, axis=0)  # Shape: (1, 224, 224, 3)

def interpret_emotion(prediction):
    # Map model output to emotion labels
    try:
        if len(prediction.shape) > 1:
            prediction = prediction[0]  # Take the first prediction
        max_index = np.argmax(prediction)
        if max_index >= len(EMOTION_LABELS):
            print(f"Error: Prediction index {max_index} exceeds labels length {len(EMOTION_LABELS)}")
            return None
        return EMOTION_LABELS[max_index]
    except Exception as e:
        print(f"Error in interpret_emotion: {e}, Prediction shape: {prediction.shape}, Prediction: {prediction}")
        return None

def predict_emotion(image, face_landmarks, switcher, w, h):
    # Crop face before emotion detection
    cropped_face = crop_face(image, face_landmarks, w, h)
    if cropped_face is None:
        return None
    try:
        model = switcher.load_emotion_model()
        if model is None:
            return None
        processed_image = preprocess_emotion(cropped_face)
        prediction = model.predict(processed_image, verbose=0)
        return interpret_emotion(prediction)
    except Exception as e:
        print(f"Error during emotion prediction: {e}")
        return None

def save_emotion_to_file(timestamp, emotion):
    try:
        with open("last_emotion.txt", "w") as f:
            f.write(f"{timestamp}: {emotion}\n")
        with open("emotion_history.txt", "a") as f:
            f.write(f"{timestamp}: {emotion}\n")
    except Exception as e:
        print(f"Error writing to emotion files: {e}")

# ===================== Drowsiness Detection ====================
def detect_drowsiness(frame, face_landmarks, t1, t2, timers, emotion, emotion_history):
    global distraction_start_time
    h, w, _ = frame.shape
    landmarks = face_landmarks.landmark
    D_TIME, YAWN_TIME, LOOKING_DOWN_TIME = timers

    def get_coords(index):
        x = int(landmarks[index].x * w)
        y = int(landmarks[index].y * h)
        return x, y

    # === Gaze Tracking ===
    left_iris = get_coords(LEFT_IRIS[0])
    right_iris = get_coords(RIGHT_IRIS[0])
    left_eye_outer = get_coords(LEFT_EYE[0])
    left_eye_inner = get_coords(LEFT_EYE[1])
    right_eye_outer = get_coords(RIGHT_EYE[0])
    right_eye_inner = get_coords(RIGHT_EYE[1])

    left_ratio = (left_iris[0] - left_eye_outer[0]) / (left_eye_inner[0] - left_eye_outer[0] + 1e-6)
    right_ratio = (right_iris[0] - right_eye_outer[0]) / (right_eye_inner[0] - right_eye_outer[0] + 1e-6)
    avg_pos = (left_ratio + right_ratio) / 2

    distraction_detected = False
    distraction_reason = ""
    if avg_pos < 0.2:
        distraction_detected = True
        distraction_reason = "Looking Right"
    elif avg_pos > 1:
        distraction_detected = True
        distraction_reason = "Looking Left"

    behavior_detected = False
    if distraction_detected:
        if distraction_start_time is None:
            distraction_start_time = time.time()
        elif time.time() - distraction_start_time > WARNING_THRESHOLD:
            # play_tone(300, 0.4)  # Commented out as per your latest code
            cv2.putText(frame, f"WARNING: Distracted ({distraction_reason})", (30, 80),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            print("DISTRACTION DETECTED!")
            behavior_detected = True
    else:
        distraction_start_time = None

    # === Drowsiness & Yawn ===
    left_eye = [get_coords(i) for i in LEFT_EYE_EAR]
    right_eye = [get_coords(i) for i in RIGHT_EYE_EAR]
    avg_ear = (calculate_ear(left_eye) + calculate_ear(right_eye)) / 2.0

    mouth = [get_coords(i) for i in MOUTH]
    mar = calculate_mar(mouth)

    # === Head Pose ===
    pitch_angle = get_head_pose(landmarks, w, h)

    # Display EAR, MAR, Pitch
    cv2.putText(frame, f'EAR: {avg_ear:.2f}', (30, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
    cv2.putText(frame, f'MAR: {mar:.2f}', (30, 55), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 200, 255), 2)
    if pitch_angle is not None:
        cv2.putText(frame, f'Pitch: {pitch_angle:.1f}', (30, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)

    # === Detections ===
    if mar > YAWN_THRESH:
        YAWN_TIME += (t2 - t1)
    else:
        YAWN_TIME = 0

    if avg_ear < EAR_THRESH:
        D_TIME += (t2 - t1)
    else:
        D_TIME = 0

    if YAWN_TIME >= YAWN_TIME_THRESH:
        D_TIME = 0
        cv2.putText(frame, "YAWNING DETECTED!", (30, 120), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 165, 255), 2)
        print("YAWNING DETECTED!")
        behavior_detected = True
        # play_tone(700, 0.4) 

    elif pitch_angle is not None and pitch_angle > PITCH_LOOKING_DOWN_THRESHOLD:
        LOOKING_DOWN_TIME += (t2 - t1)
        cv2.putText(frame, "LOOKING DOWN", (30, 150), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 200, 0), 2)
        print("DISTRACTION DETECTED!")
        # play_tone(500, 0.5) 
        if LOOKING_DOWN_TIME >= LOOKING_DOWN_DURATION_THRESHOLD:
            cv2.putText(frame, "DROWSINESS ALERT (Head Down)!", (30, 180), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            print("DROWSINESS DETECTED!")
            behavior_detected = True
            # play_tone(440, 0.7)

    elif D_TIME >= WAIT_TIME:
        cv2.putText(frame, "DROWSINESS ALERT!", (30, 90), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        print("DROWSINESS DETECTED!")
        behavior_detected = True
        # play_tone(440, 0.7)  
    else:
        LOOKING_DOWN_TIME = 0

    # === Store Emotion in History ===
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    if emotion:
        emotion_history.append((timestamp, emotion))

    # === Draw Face Mesh ===
    mp_drawing.draw_landmarks(
        frame,
        face_landmarks,
        mp_face_mesh.FACEMESH_TESSELATION,
        drawing_spec,
        drawing_spec,
    )

    return frame, (D_TIME, YAWN_TIME, LOOKING_DOWN_TIME), behavior_detected

# ===================== Main Loop ====================
def main():
    global distraction_start_time
    switcher = ModelSwitcher(EMOTION_MODEL_PATH)
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open webcam. Try changing the camera index")
        return

    D_TIME = 0
    YAWN_TIME = 0
    LOOKING_DOWN_TIME = 0
    distraction_start_time = None
    t1 = cv2.getTickCount() / cv2.getTickFrequency()
    emotion_history = []  # Store emotion detection results in memory

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Error: Failed to capture frame. Check webcam connection.")
            break
        frame = cv2.flip(frame, 1)  # Flip for mirror effect
        h, w, _ = frame.shape
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb_frame)
        t2 = cv2.getTickCount() / cv2.getTickFrequency()

        # === Emotion Detection ===
        emotion = None
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        if results.multi_face_landmarks:
            for face_landmarks in results.multi_face_landmarks:
                emotion = predict_emotion(frame, face_landmarks, switcher, w, h)
                if emotion:
                    if emotion in CRITICAL_EMOTIONS:
                        print(f"{timestamp}: Emotion Detected: {emotion}")
                    save_emotion_to_file(timestamp, emotion)

        # === Drowsiness Detection ===
        behavior_detected = False
        if results.multi_face_landmarks:
            for face_landmarks in results.multi_face_landmarks:
                frame, (D_TIME, YAWN_TIME, LOOKING_DOWN_TIME), behavior_detected = detect_drowsiness(
                    frame, face_landmarks, t1, t2, (D_TIME, YAWN_TIME, LOOKING_DOWN_TIME), emotion, emotion_history)
        else:
            cv2.putText(frame, "Drowsiness: No Face Detected", (30, 120), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

        # === Display Instructions ===
        cv2.putText(frame, "Drowsiness Monitoring Active", (30, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

        cv2.imshow("Driver Monitoring", frame)
        t1 = t2

        # Exit on 'q' key
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()
    face_mesh.close()

if __name__ == "__main__":
    main()
from asyncio.windows_events import NULL
import cv2
import numpy as np
import time
import sounddevice as sd
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array
import mediapipe as mp
from collections import deque, Counter
from cv2 import solvePnP, Rodrigues
import signal
import sys

# Termination handling
stop_flag = False
def handle_sigterm(signum, frame):
    global stop_flag
    print("[Subprocess] SIGTERM received. Exiting...")
    stop_flag = True
    sys.exit(0)

signal.signal(signal.SIGTERM, handle_sigterm)
signal.signal(signal.SIGINT, handle_sigterm)

# Camera blocked check
def is_camera_blocked(frame, brightness_threshold=30, variance_threshold=50):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    avg_brightness = np.mean(gray)
    variance = np.var(gray)
    return avg_brightness < brightness_threshold and variance < variance_threshold

# Sound alert
def play_tone(freq, duration, samplerate=44100):
    t = np.linspace(0, duration, int(samplerate * duration), endpoint=False)
    waveform = 0.5 * np.sin(2 * np.pi * freq * t)
    sd.play(waveform, samplerate)
    sd.wait()

# Load emotion model
classifier = load_model('./Models/python_code_exec/drowsiness_distraction_detection/emotion_face_mobilNetv6.h5', compile=False)
# classifier = load_model('./emotion_face_mobilNetv6.h5', compile=False)
class_labels = ['Angry', 'Fear', 'Happy', 'Neutral', 'Sad']

# Emotion history
emotion_history = deque(maxlen=10)
emotion_check_interval = 10
frame_count = 0
prev_emotion = None

# MediaPipe setup
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(refine_landmarks=True)
mp_drawing = mp.solutions.drawing_utils

# Landmark indexes
LEFT_IRIS = [474, 475, 476, 477]
RIGHT_IRIS = [469, 470, 471, 472]
LEFT_EYE = [33, 133]
RIGHT_EYE = [362, 263]
LEFT_EYE_EAR = [33, 160, 158, 133, 153, 144]
RIGHT_EYE_EAR = [362, 385, 387, 263, 373, 380]
MOUTH = [61, 81, 13, 311, 291, 402, 14, 178]

# Thresholds
EAR_THRESH = 0.15
WAIT_TIME = 1.25
YAWN_THRESH = 0.45
YAWN_TIME_THRESH = 1.2
WARNING_THRESHOLD = 3
PITCH_LOOKING_DOWN_THRESHOLD = 35
LOOKING_DOWN_DURATION_THRESHOLD = 2

# State trackers
D_TIME = 0
YAWN_TIME = 0
LOOKING_DOWN_TIME = 0
distraction_start_time = None
was_distracted = False

# Helper functions
def calculate_ear(eye):
    return (np.linalg.norm(np.array(eye[1]) - np.array(eye[5])) +
            np.linalg.norm(np.array(eye[2]) - np.array(eye[4]))) / \
           (2.0 * np.linalg.norm(np.array(eye[0]) - np.array(eye[3])))

def calculate_mar(mouth):
    return (np.linalg.norm(np.array(mouth[1]) - np.array(mouth[7])) +
            np.linalg.norm(np.array(mouth[2]) - np.array(mouth[6])) +
            np.linalg.norm(np.array(mouth[3]) - np.array(mouth[5]))) / \
           (3.0 * np.linalg.norm(np.array(mouth[0]) - np.array(mouth[4])))

def get_head_pose(landmarks, w, h):
    image_points = np.array([
        (landmarks[1].x * w, landmarks[1].y * h),
        (landmarks[33].x * w, landmarks[33].y * h),
        (landmarks[263].x * w, landmarks[263].y * h),
        (landmarks[61].x * w, landmarks[61].y * h),
        (landmarks[291].x * w, landmarks[291].y * h),
        (landmarks[199].x * w, landmarks[199].y * h)
    ], dtype='double')
    model_points = np.array([
        (0.0, 0.0, 0.0),
        (-30.0, -30.0, -30.0),
        (30.0, -30.0, -30.0),
        (-40.0, 30.0, -30.0),
        (40.0, 30.0, -30.0),
        (0.0, 70.0, -50.0)
    ])
    camera_matrix = np.array([
        [w, 0, w / 2],
        [0, w, h / 2],
        [0, 0, 1]
    ], dtype='double')
    success, rotation_vector, _ = solvePnP(model_points, image_points, camera_matrix, np.zeros((4, 1)))
    if not success:
        return None
    rotation_mat, _ = Rodrigues(rotation_vector)
    pitch = np.arcsin(-rotation_mat[2][1]) * 180 / np.pi
    return pitch

# Open camera
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("Error: Cannot access camera.")
    sys.exit(1)

# Check camera before starting
while True:
    ret, frame = cap.read()
    if not ret:
        print("Error reading from camera.")
        sys.exit(1)
    if is_camera_blocked(frame):
        cv2.putText(frame, "Camera is covered", (50, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
        print("Camera is covered")
    else:
        print("Camera is clear")
        break

t1 = cv2.getTickCount() / cv2.getTickFrequency()

# Main loop
while not stop_flag:
    ret, frame = cap.read()
    if not ret:
        break

    # Flip and check if camera is blocked
    frame = cv2.flip(frame, 1)
    if is_camera_blocked(frame):
        cv2.putText(frame, "Camera is covered. Please uncover...", (50, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)
        print("Camera is covered")

    h, w = frame.shape[:2]
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb_frame)
    t2 = cv2.getTickCount() / cv2.getTickFrequency()
    skip_emotion_check = False
    is_currently_distracted = False

    if results.multi_face_landmarks:
        for face_landmarks in results.multi_face_landmarks:
            landmarks = face_landmarks.landmark
            def get_coords(i): return int(landmarks[i].x * w), int(landmarks[i].y * h)

            left_eye = [get_coords(i) for i in LEFT_EYE_EAR]
            right_eye = [get_coords(i) for i in RIGHT_EYE_EAR]
            avg_ear = (calculate_ear(left_eye) + calculate_ear(right_eye)) / 2.0
            mouth = [get_coords(i) for i in MOUTH]
            mar = calculate_mar(mouth)
            pitch_angle = get_head_pose(landmarks, w, h)

            # Distraction by gaze
            left_iris = get_coords(LEFT_IRIS[0])
            right_iris = get_coords(RIGHT_IRIS[0])
            left_eye_outer, left_eye_inner = get_coords(LEFT_EYE[0]), get_coords(LEFT_EYE[1])
            right_eye_outer, right_eye_inner = get_coords(RIGHT_EYE[0]), get_coords(RIGHT_EYE[1])
            left_ratio = (left_iris[0] - left_eye_outer[0]) / (left_eye_inner[0] - left_eye_outer[0] + 1e-6)
            right_ratio = (right_iris[0] - right_eye_outer[0]) / (right_eye_inner[0] - right_eye_outer[0] + 1e-6)
            avg_pos = (left_ratio + right_ratio) / 2

            # Gaze distraction logic
            if avg_pos < 0.2 or avg_pos > 1:
                if distraction_start_time is None:
                    distraction_start_time = time.time()
                elif time.time() - distraction_start_time > WARNING_THRESHOLD:
                    cv2.putText(frame, "WARNING: Distracted", (30, 80), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
                    if not was_distracted:
                        print("DISTRACTION DETECTED!")
                    is_currently_distracted = True
                    skip_emotion_check = True
            else:
                distraction_start_time = None

            # Looking down logic
            if pitch_angle and pitch_angle > PITCH_LOOKING_DOWN_THRESHOLD:
                LOOKING_DOWN_TIME += (t2 - t1)
                cv2.putText(frame, "LOOKING DOWN", (30, 150), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 200, 0), 2)
                if not was_distracted:
                    print("DISTRACTION DETECTED!")
                is_currently_distracted = True
                if LOOKING_DOWN_TIME >= LOOKING_DOWN_DURATION_THRESHOLD:
                    cv2.putText(frame, "DROWSINESS ALERT (Head Down)!", (30, 180),
                                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
                    print("DROWSINESS DETECTED!")
                    skip_emotion_check = True
            else:
                LOOKING_DOWN_TIME = 0

            # Print FOCUS once if recovered from distraction
            if was_distracted and not is_currently_distracted:
                print("FOCUS")
            was_distracted = is_currently_distracted

            # Yawning
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
                cv2.putText(frame, "YAWNING DETECTED!", (30, 120),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 165, 255), 2)
                print("YAWNING DETECTED!")
                skip_emotion_check = True
            elif D_TIME >= WAIT_TIME:
                cv2.putText(frame, "DROWSINESS ALERT!", (30, 90),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
                print("DROWSINESS DETECTED!")
                skip_emotion_check = True

            # Emotion detection
            frame_count += 1
            if not skip_emotion_check and frame_count % emotion_check_interval == 0:
                x_coords = [int(lm.x * w) for lm in landmarks]
                y_coords = [int(lm.y * h) for lm in landmarks]
                x_min, x_max = max(min(x_coords) - 20, 0), min(max(x_coords) + 20, w)
                y_min, y_max = max(min(y_coords) - 20, 0), min(max(y_coords) + 20, h)
                face_img = rgb_frame[y_min:y_max, x_min:x_max]
                if face_img.size != 0:
                    face_resized = cv2.resize(face_img, (224, 224))
                    face_array = img_to_array(face_resized.astype("float") / 255.0)
                    face_array = np.expand_dims(face_array, axis=0)
                    preds = classifier.predict(face_array, verbose=0)[0]
                    emotion = class_labels[np.argmax(preds)]
                    emotion_history.append(emotion)

    # Show dominant emotion
    if emotion_history:
        dominant_emotion = Counter(emotion_history).most_common(1)[0][0]
        cv2.putText(frame, f"Emotion: {dominant_emotion}", (w - 250, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 255), 2)
        if prev_emotion != dominant_emotion:
            prev_emotion = dominant_emotion
            print(dominant_emotion)

    t1 = t2
    # cv2.imshow("Driver Monitoring System", frame) 
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()

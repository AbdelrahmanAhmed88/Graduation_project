import cv2
import mediapipe as mp
import numpy as np
import time
import sounddevice as sd

# ===================== Sound Alert ====================
def play_tone(freq, duration, samplerate=44100):
    t = np.linspace(0, duration, int(samplerate * duration), endpoint=False)
    waveform = 0.5 * np.sin(2 * np.pi * freq * t)
    sd.play(waveform, samplerate)
    sd.wait()

# ===================== MediaPipe Setup ====================
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(refine_landmarks=True)
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
MOUTH = [61, 291, 81, 178, 13, 14, 312, 308]

# ===================== Thresholds ====================
EAR_THRESH = 0.25
WAIT_TIME = 1.25
YAWN_THRESH = 0.45
YAWN_TIME_THRESH = 1.2
WARNING_THRESHOLD = 3

# ===================== Timers ====================
D_TIME = 5
YAWN_TIME = 3
distraction_start_time = None

# ===================== Camera Setup ====================
cap = cv2.VideoCapture(0)
t1 = cv2.getTickCount() / cv2.getTickFrequency()

# ===================== EAR/MAR Calculations ====================
def calculate_ear(eye):
    vertical_1 = np.linalg.norm(np.array(eye[1]) - np.array(eye[5]))
    vertical_2 = np.linalg.norm(np.array(eye[2]) - np.array(eye[4]))
    horizontal = np.linalg.norm(np.array(eye[0]) - np.array(eye[3]))
    ear = (vertical_1 + vertical_2) / (2.0 * horizontal)
    return ear

def calculate_mar(mouth):
    vertical_1 = np.linalg.norm(np.array(mouth[2]) - np.array(mouth[5]))
    vertical_2 = np.linalg.norm(np.array(mouth[3]) - np.array(mouth[4]))
    horizontal = np.linalg.norm(np.array(mouth[0]) - np.array(mouth[1]))
    mar = (vertical_1 + vertical_2) / (2.0 * horizontal)
    return mar

# ===================== Main Loop ====================
while True:
    ret, frame = cap.read()
    if not ret:
        break
    frame = cv2.flip(frame, 1)
    h, w, _ = frame.shape
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb_frame)

    t2 = cv2.getTickCount() / cv2.getTickFrequency()

    if results.multi_face_landmarks:
        for face_landmarks in results.multi_face_landmarks:
            landmarks = face_landmarks.landmark
            # === Convert to pixel coordinates ===
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
                distraction_reason = "Looking Left"
            elif avg_pos > 0.9:
                distraction_detected = True
                distraction_reason = "Looking Right"

            if distraction_detected:
                if distraction_start_time is None:
                    distraction_start_time = time.time()
                elif time.time() - distraction_start_time > WARNING_THRESHOLD:
                    play_tone(300, 0.4)
                    cv2.putText(frame, f"WARNING: Distracted ({distraction_reason})", (30, 80),
                                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            else:
                distraction_start_time = None

            # === Drowsiness & Yawn ===
            left_eye = [get_coords(i) for i in LEFT_EYE_EAR]
            right_eye = [get_coords(i) for i in RIGHT_EYE_EAR]
            avg_ear = (calculate_ear(left_eye) + calculate_ear(right_eye)) / 2.0

            mouth = [get_coords(i) for i in MOUTH]
            mar = calculate_mar(mouth)

            # Display EAR and MAR
            cv2.putText(frame, f'EAR: {avg_ear:.2f}', (30, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            cv2.putText(frame, f'MAR: {mar:.2f}', (30, 55), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 200, 255), 2)

            # Logic
            if avg_ear < EAR_THRESH:
                D_TIME += (t2 - t1)
            else:
                D_TIME = 0

            if mar > YAWN_THRESH:
                YAWN_TIME += (t2 - t1)
            else:
                YAWN_TIME = 0

            if YAWN_TIME >= YAWN_TIME_THRESH:
                D_TIME = 0
                cv2.putText(frame, "YAWNING DETECTED!", (30, 120), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 165, 255), 2)
                print("YAWNING DETECTED!")
                # play_tone(700, 0.4)

            if D_TIME >= WAIT_TIME:
                cv2.putText(frame, "DROWSINESS ALERT!", (30, 90), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
                print("DROWSINESS DETECTED!")
                # play_tone(440, 0.7)

            # === Draw all face points ===
            mp_drawing.draw_landmarks(
                frame,
                face_landmarks,
                mp_face_mesh.FACEMESH_TESSELATION,
                drawing_spec,
                drawing_spec,
            )

    t1 = t2
    # cv2.imshow("Driver Monitoring Distraction and Drowsiness", frame)
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()

import subprocess

import subprocess

# Define this at the top level
detection_process = None

def DrowsinessDistractionDetectionexec(callback):
    global detection_process
    try:
        detection_process = subprocess.Popen(
            ["python", "-u", "./Models/python_code_exec/drowsiness_distraction_detection/drowsiness&emotion_v1.py"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1
        )

        # Read stdout line by line
        for line in detection_process.stdout:
            cleaned_line = line.strip()
            if cleaned_line:
                callback(cleaned_line)

    except Exception as e:
        print(f"Unexpected error: {e}")


def stop_drowsiness_distraction_detection():
    global detection_process
    if detection_process and detection_process.poll() is None:
        print("Stopping detection subprocess...")
        detection_process.terminate()  # or use .kill() if needed
        detection_process.wait()
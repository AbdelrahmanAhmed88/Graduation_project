import subprocess
import threading

# Define this at the top level
detection_process = None
detection_thread = None

def _read_detection_output(callback):
    global detection_process
    try:
        for line in detection_process.stdout:
            cleaned_line = line.strip()
            if cleaned_line:
                callback(cleaned_line)
    except Exception as e:
        print(f"Error reading from detection subprocess: {e}")

def DrowsinessDistractionDetectionexec(callback):
    global detection_process, detection_thread
    print("drowsiness_distraction_detection started")
    try:
        detection_process = subprocess.Popen(
            ["python", "-u", "./Models/python_code_exec/drowsiness_distraction_detection/Driver Monitoring.py"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1
        )

        # Start the output reading in a background thread
        detection_thread = threading.Thread(target=_read_detection_output, args=(callback,), daemon=True)
        detection_thread.start()

    except Exception as e:
        print(f"Unexpected error starting subprocess: {e}")


def stop_drowsiness_distraction_detection():
    global detection_process
    if detection_process and detection_process.poll() is None:
        print("Stopping detection subprocess...")
        detection_process.terminate()
        try:
            detection_process.wait(timeout=3)
        except subprocess.TimeoutExpired:
            print("Subprocess did not terminate in time. Killing...")
            detection_process.kill()
            detection_process.wait()
        finally:
            detection_process = None

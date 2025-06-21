def DrowsinessDistractionDetectionexec(callback):
    try:
        process = subprocess.Popen(
            ["python", "./Models/python_code_exec/drowsiness_distraction_detection/Drowsiness_Distration_v2.py"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,  # Merge stderr with stdout
            text=True,
            bufsize=1
        )

        for line in process.stdout:
            cleaned_line = line.strip()
            if cleaned_line:
                print("[Subprocess Output]:", cleaned_line)  # Optional for debugging
                callback(cleaned_line)

    except Exception as e:
        print(f"Unexpected error: {e}")

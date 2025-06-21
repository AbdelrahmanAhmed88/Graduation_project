import subprocess

def face_check(callback):
    try:
        result = subprocess.run(
            ["python", "./Models/python_code_exec/access_control/AccesControlv3.py"],
            capture_output=True,
            text=True,
            check=True
        )
        identity = result.stdout.strip()
        callback(identity)
    except subprocess.CalledProcessError as e:
        print(f"Error: {e}")
        print(f"Stdout:\n{e.stdout}")
        print(f"Stderr:\n{e.stderr}")
    except Exception as e:
        print(f"Unexpected error: {e}")

def store_encoding():
    try:
        result = subprocess.run(
            ["python", "./Models/python_code_exec/access_control/storeEncodings.py"],
            capture_output=True,
            text=True,
            check=True
        )
        print(result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"Error: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")

# Example of how you'd use face_check
def my_callback(identity):
    print(f"Identity received: {identity}")

# Example usage:
# face_check(my_callback)
# store_encoding()

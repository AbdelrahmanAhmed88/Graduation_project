#config.py can be edited later for RSP

# Serial Port Configuration
SERIAL_PORT = "COM9"        # Adjust to your serial port (e.g., COMx or /dev/ttyUSB0 on Linux)
BAUD_RATE = 115200          # Set the baud rate for your serial connection
TIMEOUT = 1                 # seconds
DELIMITER = '!'
VIN = "1HGCM82633A004352"
CAR_MODEL = "Model B"
FIRST_START = False
MASTER_CARDS = {"D3BD70FA"}



#connection urls
WEB_SOCKET_SERVER_URL = "ws://localhost:5000"
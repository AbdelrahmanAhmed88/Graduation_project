import serial
import threading
from config import vehicle_config

class SerialReader:
    def __init__(self,port=vehicle_config.SERIAL_PORT, baudrate=vehicle_config.BAUD_RATE, delimiter=vehicle_config.DELIMITER,vin = vehicle_config.VIN):
        self.port = port
        self.baudrate = baudrate
        self.delimiter = delimiter
        self.buffer = ''
        self.vehicle_id = vin

        # Callback placeholders
        self.on_vehicle_id = None
        self.on_user_signal = None
        self.on_nfc_id = None
        self.on_command = None

        # Initialize the lock for thread-safe buffer access
        self.lock = threading.Lock()

    def start(self):
        try:
            self.serial_port = serial.Serial(self.port,self.baudrate,timeout=1)
            print(f"[SerialReader] Serial port {self.port} opened.")
            self.thread = threading.Thread(target=self.read_loop)
            self.thread.daemon = True
            self.thread.start()

        except serial.SerialException as e:
            print(f"[SerialReader] Error opening serial port: {e}")  

    def read_loop(self):
        while True:
            try:
                if self.serial_port.in_waiting: 
                    data = self.serial_port.read(self.serial_port.in_waiting).decode('utf-8', errors='ignore')
                    print(f"[SerialReader] Data received: {data}")  # Debug print

                    with self.lock:
                        self.buffer += data

                    if self.delimiter in self.buffer:
                        full_msg = self.buffer.split(self.delimiter)[0].strip()
                        self.process_message(full_msg)

                        with self.lock:
                            self.buffer = ''
                
            except Exception as e:
                print(f"[SerialReader] Error reading from serial: {e}")

    def process_message(self,msg):
        if not msg:
            return
        
        identifier = msg[0]
        content = msg[1:]

        if identifier == 'v' and self.on_vehicle_id:
            self.vehicle_id = content
            self.on_vehicle_id(content)

        elif identifier == 'u' and self.on_user_signal:
            self.on_user_signal()

        elif identifier == 'n' and self.on_nfc_id:
            self.on_nfc_id(content)

        elif identifier == 'c' and self.on_command:
            self.on_command(content)

    def send(self,message):
        try:
            self.serial_port.write(message.encode())
            print(f"[SerialReader] Sent to esp32: {message}")
        except Exception as e:
            print(f"[SerialReader] Error sending data: {e}")
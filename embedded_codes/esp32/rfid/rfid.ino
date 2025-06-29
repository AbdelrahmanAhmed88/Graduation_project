#include <SPI.h>
#include <Adafruit_PN532.h>

// ESP32 SPI default pins
#define PN532_SCK  18  // VSPI SCK
#define PN532_MOSI 23  // VSPI MOSI
#define PN532_MISO 19  // VSPI MISO
#define PN532_SS    5  // Chip Select (customizable)

// Create PN532 object
Adafruit_PN532 nfc(PN532_SCK, PN532_MISO, PN532_MOSI, PN532_SS);

// Use HardwareSerial instead of SoftwareSerial
HardwareSerial stmSerial(1);  // Use UART1

String VIN = "";
String nfc_passed = "N";
bool wait_response = false;

void setup() {
  Serial.begin(115200);            // USB serial monitor
  stmSerial.begin(9600, SERIAL_8N1, 13, 12);  // RX = GPIO 13, TX = GPIO 12


  nfc.begin();
  nfc.wakeup();  // Ensure PN532 is awake
  delay(100);

  uint32_t versiondata = nfc.getFirmwareVersion();
  if (!versiondata) {
    Serial.println("PN532 not found. Check wiring or SPI mode!");
    while (1);
  }

  nfc.setPassiveActivationRetries(0xFF);
  nfc.SAMConfig();
}

void loop() {
  // Receive command from Python (via Serial)
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd == "O") {
      nfc_passed = "O";
      stmSerial.print(cmd);
      wait_response = false;
    } else if (cmd == "N") {
      nfc_passed = "N";
      stmSerial.print(cmd);
      wait_response = false;
    } else if (cmd == "U") {
      stmSerial.print(cmd);
      wait_response = false;
    } else if (cmd == "L") {
      stmSerial.print(cmd);
      wait_response = false;
    }
  }

  // Receive from STM32
  if (stmSerial.available()) {
    String stmCmd = stmSerial.readStringUntil('\n');
    if (stmCmd == "E") {
      nfc_passed = "N";
      Serial.print("cexit!");
      wait_response = false;
    }
    if (stmCmd == "S") {
      Serial.print("cstart!");
      // wait_response = false;
    }
  }

  // NFC scanning
  if (wait_response == false) {
    uint8_t uid[7];
    uint8_t uidLength;

    nfc.setPassiveActivationRetries(0xFF);
    nfc.SAMConfig();

    if (nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength,60)) {
      String uidString = "";

      for (uint8_t i = 0; i < uidLength; i++) {
        if (uid[i] < 0x10) uidString += "0";
        uidString += String(uid[i], HEX);
      }

      uidString.toUpperCase();
      Serial.print("n" + uidString + "!");
      wait_response = true;

      delay(1000);
    }
  }
}
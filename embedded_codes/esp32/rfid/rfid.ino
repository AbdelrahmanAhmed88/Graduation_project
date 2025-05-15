#include <Arduino.h>
#include <Adafruit_PN532.h>

// Updated GPIO pins for PN532 over UART
#define PN532_RX 21  // ESP32 RX  (connect to PN532 TX)
#define PN532_TX 22  // ESP32 TX  (connect to PN532 RX)

// Updated GPIO pins for STM32 UART (if needed)
#define STM32_RX 4   // ESP32 RX  (connect to STM32 TX)
#define STM32_TX 2   // ESP32 TX  (connect to STM32 RX)

String VIN = "";
String nfc_passed = "N";
bool wait_response = false;

// Use UART1 for PN532
HardwareSerial pnSerial(1);  // UART1 for PN532
Adafruit_PN532 nfc(pnSerial);

// Use UART2 for STM32
HardwareSerial stmSerial(2); // UART2 for STM32

void setup() {
  Serial.begin(115200); // Debug USB serial

  // Start STM32 UART (adjust baud if needed)
  stmSerial.begin(9600, SERIAL_8N1, STM32_RX, STM32_TX);

  // Start PN532 UART
  pnSerial.begin(115200, SERIAL_8N1, PN532_RX, PN532_TX);
  delay(100);

  nfc.begin();
  delay(100);

  uint32_t versiondata = nfc.getFirmwareVersion();
  if (!versiondata) {
    Serial.println("PN532 not found over UART. Check wiring!");
    while (1); // Halt
  }

  nfc.setPassiveActivationRetries(0xFF);
  nfc.SAMConfig();  
  Serial.println("Waiting for an NFC card...");
}

void loop() {
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
    }
  }

  if (stmSerial.available()) {
    String stmCmd = stmSerial.readStringUntil('\n');
    if (stmCmd == "E") {
      nfc_passed = "N";
      Serial.print("cexit!");
      wait_response = false;
    }
  }

  if (nfc_passed == "N" && !wait_response) {
    uint8_t success;
    uint8_t uid[7];
    uint8_t uidLength;

    success = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength);

    if (success) {
      String uidString = "";
      for (uint8_t i = 0; i < uidLength; i++) {
        if (uid[i] < 0x10) uidString += "0";
        uidString += String(uid[i], HEX);
      }
      uidString.toUpperCase();
      Serial.println("n" + uidString + "!");
      wait_response = true;
      delay(1000);
    }
  }
}

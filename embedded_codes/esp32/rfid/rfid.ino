#include <SPI.h>
#include <Adafruit_PN532.h>

// ESP32 SPI default pins
#define PN532_SCK  18
#define PN532_MOSI 23
#define PN532_MISO 19
#define PN532_SS    5

Adafruit_PN532 nfc(PN532_SCK, PN532_MISO, PN532_MOSI, PN532_SS);

// Use HardwareSerial instead of SoftwareSerial
HardwareSerial stmSerial(1);  // UART1

String nfc_passed = "N";
bool wait_response = false;

void setup() {
  Serial.begin(115200);                         // USB serial monitor
  stmSerial.begin(9600, SERIAL_8N1, 13, 12);    // RX = GPIO 13, TX = GPIO 12

  nfc.begin();
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
  // Handle incoming command from PC/Python
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd == "O" || cmd == "N" || cmd == "U" || cmd == "L" || cmd == "A" || cmd == "S") {
      nfc_passed = cmd;
      stmSerial.print(cmd);
      wait_response = false;
    }
  }

  // Handle response from STM32
  if (stmSerial.available()) {
    String stmCmd = stmSerial.readStringUntil('\n');
    stmCmd.trim();
    if (stmCmd == "E") {
      nfc_passed = "N";
      Serial.println("cexit!");
      wait_response = false;
    } else if (stmCmd == "S") {
      Serial.println("cstart!");
    }
  }

  // NFC scanning
  if (!wait_response) {
    uint8_t uid[7];
    uint8_t uidLength;

    if (nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 60)) {
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

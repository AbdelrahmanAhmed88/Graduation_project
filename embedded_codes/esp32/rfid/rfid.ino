//ESP8266 (NodeMCU Lolin V3)
#include <SoftwareSerial.h>
#include <SPI.h>
#include <Adafruit_PN532.h>

// Define SPI pins for NodeMCU Lolin V3
#define PN532_SCK  14  // D5 (GPIO14)
#define PN532_MOSI 13  // D7 (GPIO13)
#define PN532_MISO 12  // D6 (GPIO12)
#define PN532_SS   15  // D8 (GPIO15)

String VIN = "";
String nfc_passed = "N";
bool wait_response = false;


// Create PN532 object for SPI communication
Adafruit_PN532 nfc(PN532_SCK, PN532_MISO, PN532_MOSI, PN532_SS);

SoftwareSerial stmSerial(D2, D1); // RX, TX

void setup() {
  Serial.begin(115200);      // USB debug
  stmSerial.begin(9600);     // STM32 side

  // Serial.println("ESP listening to STM32...");

  
  // Initialize Serial Monitor
  Serial.begin(115200);
  while (!Serial) delay(10);
  // Serial.println("PN532 NFC RFID V3 with ESP8266 (SPI)");

  // Initialize PN532
  nfc.begin();
  nfc.wakeup(); // Ensure PN532 is awake (corrected from wakeUp)
  delay(100);

  // Check if PN532 is connected
  uint32_t versiondata = nfc.getFirmwareVersion();
  if (!versiondata) {
    // Serial.println("PN532 not found. Check wiring or SPI mode!");
    while (1);
  }

  // // Display firmware version
  // Serial.print("Found PN532 with firmware version: ");
  // Serial.print((versiondata >> 24) & 0xFF, DEC);
  // Serial.print(".");
  // Serial.println((versiondata >> 16) & 0xFF, DEC);

  // Configure PN532
  nfc.setPassiveActivationRetries(0xFF);
  nfc.SAMConfig();
  // Serial.println("Waiting for an NFC card...");
}

void loop() {
  // Wait for VIN from STM32 via SoftwareSerial
  // while (VIN == "") {
  //   if (stmSerial.available()) {
  //     VIN = stmSerial.readStringUntil('\n');
  //     Serial.print(VIN);  // Print the received VIN
  //   }
  // }


  // python commands
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd == "O") {
      nfc_passed = "O";
      stmSerial.print(cmd);
      wait_response = false;
    } else if (cmd == "N") {
      nfc_passed = "N";  // Start NFC scanning
      stmSerial.print(cmd);
      wait_response = false;
    } else if (cmd == "U") { //user found
      stmSerial.print(cmd);
    }
  }

   if (stmSerial.available()) {
      String stmCmd = stmSerial.readStringUntil('\n');
      if (stmCmd == "E") {
        nfc_passed = "N";
        Serial.print("cexit!"); 
        nfc_passed == "N";
        wait_response = false;
      }
    }

  // Only scan NFC if nfc_passed == "N"
  if (nfc_passed == "N" && wait_response == false) {
    uint8_t success;
    uint8_t uid[] = { 0, 0, 0, 0, 0, 0, 0 };
    uint8_t uidLength;

    // Reconfigure RF field (required to restart NFC if the field was disabled)
    nfc.setPassiveActivationRetries(0xFF);
    nfc.SAMConfig();

    // Try to read a card
    success = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength);

    if (success) {
      String uidString = "";

      // Format UID as a string (zero padding for single hex digits)
      for (uint8_t i = 0; i < uidLength; i++) {
        if (uid[i] < 0x10) uidString += "0";  // zero padding for single hex digits
        uidString += String(uid[i], HEX);
      }

      uidString.toUpperCase();  // Convert UID to uppercase for consistency
      Serial.print("n"+uidString+"!");  // Print UID
      wait_response = true;

      delay(1000);  // Delay between reads to avoid overwhelming the serial monitor
    }
  }
}
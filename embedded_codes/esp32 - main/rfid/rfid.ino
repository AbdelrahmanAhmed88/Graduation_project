#include <SPI.h>
#include <Adafruit_PN532.h>

// =====================
// Hardware SPI Pins for ESP32 (VSPI)
// =====================
#define PN532_SS 5  // Chip select

// Use hardware SPI (VSPI default: SCK=18, MOSI=23, MISO=19)
Adafruit_PN532 nfc(PN532_SS);

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("Looking for PN532 using ESP32 (Hardware SPI)...");

  nfc.begin();
  delay(100);

  uint32_t versiondata = 0;
  while (!versiondata) {
    Serial.println("Trying to find PN532...");
    versiondata = nfc.getFirmwareVersion();
    if (!versiondata) {
      Serial.println("Didn't find PN532 board. Check wiring and SPI mode!");
      delay(1000);
    }
  }

  Serial.print("Found PN532 with firmware version: ");
  Serial.print((versiondata >> 24) & 0xFF, DEC);
  Serial.print(".");
  Serial.println((versiondata >> 16) & 0xFF, DEC);

  nfc.setPassiveActivationRetries(0xFF);  // Retry forever
  nfc.SAMConfig();                        // Configure board

  Serial.println("Waiting for an NFC card...");
}

void loop() {
  uint8_t uid[7];
  uint8_t uidLength;

  bool success = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 1000);

  if (success) {
    Serial.print("Card detected! UID: ");
    for (uint8_t i = 0; i < uidLength; i++) {
      if (uid[i] < 0x10) Serial.print("0");
      Serial.print(uid[i], HEX);
    }
    Serial.println();
    delay(2000);  // Delay to avoid duplicate reads
  } else {
    Serial.println("No card detected.");
  }

  delay(500);  // Polling delay
}

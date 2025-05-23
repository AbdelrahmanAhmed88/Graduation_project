#include <Arduino.h>
#include <painlessMesh.h>
#include <ESP32Servo.h>
#include "room_commands.h"



painlessMesh mesh;

Servo fan;

void handleCommand(const String &cmd);
void sendLog(const String &device, const String &status);
void receivedCallback(uint32_t from, String &msg);
void newConnectionCallback(uint32_t nodeId);

void setup() {
    Serial.begin(115200);
    pinMode(LIGHT_PIN, OUTPUT);
    fan.attach(FAN_PIN); // Attach the servo to the fan pin
    fan.write(0); // Set initial position to 0 degrees (off)

    mesh_init(); // Initialize the mesh network
}

void loop() {
  mesh.update();
}

void receivedCallback(uint32_t from, String &msg) {
  Serial.printf("Received: %s\n", msg.c_str());
  handleCommand(msg);
}

void handleCommand(const String &cmd) {
  if (cmd == CMD_LIGHT_ON) {
    digitalWrite(LIGHT_PIN, HIGH);
    sendLog(DEVICE_LIGHT, "on");
  } else if (cmd == CMD_LIGHT_OFF) {
    digitalWrite(LIGHT_PIN, LOW);
    sendLog(DEVICE_LIGHT, "off");
  } else if (cmd == CMD_FAN_ON) {
    fan.write(90); // Set the servo to 90 degrees (on)
    sendLog(DEVICE_FAN, "on");
  } else if (cmd == CMD_FAN_OFF) {
    fan.write(0); // Set the servo to 0 degrees (off)
    sendLog(DEVICE_FAN, "off");
  }
}

void sendLog(const String &device, const String &status) {
  String json = "{\"type\":\"actuator_status\",\"node\":\"room\",\"device\":\"" + device + "\",\"status\":\"" + status + "\"}";
  mesh.sendBroadcast(json);
  Serial.println("Log sent: " + json);
}

void newConnectionCallback(uint32_t nodeId) {
  Serial.printf("New node connected! Node ID: %u\n", nodeId);
}

void mesh_init() {
    // Initialize Mesh network
    // WiFi.mode(WIFI_STA);
    mesh.setDebugMsgTypes(ERROR | STARTUP | CONNECTION);
    mesh.init(MESH_PREFIX, MESH_PASSWORD, MESH_PORT);
    mesh.onReceive(&receivedCallback);
    mesh.onNewConnection(&newConnectionCallback);
    Serial.println("ESP32 Mesh Node Started");
}
#ifndef ROOM_COMMANDS_H
#define ROOM_COMMANDS_H

// CONFIGS
#define MESH_PREFIX     "espmesh"
#define MESH_PASSWORD   "mesh865246"
#define MESH_PORT       5555

// SENSOR
#define RXp2 16
#define TXp2 17
#define DHTPIN 4
#define PIRPIN 5
#define DHTTYPE DHT11

// ACTUATOR
#define LIGHT_PIN 4
#define FAN_PIN   2
#define TEMP_THRESHOLD 28.0 // Temperature threshold for fan activation

// Control Commands (Plain Strings)
#define CMD_LIGHT_ON       "light_on"
#define CMD_LIGHT_OFF      "light_off"
#define CMD_FAN_ON         "fan_on"
#define CMD_FAN_OFF        "fan_off"
#define CMD_AUTO_ON        "room_auto_on"
#define CMD_AUTO_OFF       "room_auto_off"

// Devices
#define DEVICE_LIGHT       "light"
#define DEVICE_FAN         "fan"
#define DEVICE_PIR         "motion"
#define DEVICE_TEMP        "temperature"

#endif

#include <Arduino.h>
#include <WiFi.h>
#include <FirebaseESP32.h>   // Install "Firebase ESP32 Client" library

#define WIFI_SSID      "Redmi Note 13 5G"
#define WIFI_PASSWORD  "12345678"
#define API_KEY        "AIzaSyCPHVRbepbXkTrVVQZJafOqmo6p6LgEwGw"
#define DATABASE_URL   "https://sample-9daef-default-rtdb.asia-southeast1.firebasedatabase.app"

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

const int RELAY1_PIN = 16;
const int RELAY2_PIN = 17;
const int RELAY3_PIN = 18;
const int RELAY4_PIN = 19;

void setRelay(int id, bool state) {
  int pin;
  switch (id) {
    case 1: pin = RELAY1_PIN; break;
    case 2: pin = RELAY2_PIN; break;
    case 3: pin = RELAY3_PIN; break;
    case 4: pin = RELAY4_PIN; break;
    default: return;
  }
  digitalWrite(pin, state ? HIGH : LOW);
  Serial.printf("Relay %d -> %s\n", id, state ? "ON" : "OFF");
  Firebase.RTDB.setBool(&fbdo, "/relays/relay" + String(id), state);
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");

  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  pinMode(RELAY1_PIN, OUTPUT);
  pinMode(RELAY2_PIN, OUTPUT);
  pinMode(RELAY3_PIN, OUTPUT);
  pinMode(RELAY4_PIN, OUTPUT);

  digitalWrite(RELAY1_PIN, LOW);
  digitalWrite(RELAY2_PIN, LOW);
  digitalWrite(RELAY3_PIN, LOW);
  digitalWrite(RELAY4_PIN, LOW);

  if (!Firebase.RTDB.beginStream(&fbdo, "/relays")) {
    Serial.printf("Stream begin error: %s\n", fbdo.errorReason().c_str());
  }
}

void loop() {
  if (!Firebase.RTDB.readStream(&fbdo)) {
    Serial.printf("Stream read error: %s\n", fbdo.errorReason().c_str());
  }
  if (fbdo.streamAvailable()) {
    String path = fbdo.streamPath();
    String data = fbdo.stringData();
    if (path.endsWith("/relay1")) setRelay(1, data == "true");
    if (path.endsWith("/relay2")) setRelay(2, data == "true");
    if (path.endsWith("/relay3")) setRelay(3, data == "true");
    if (path.endsWith("/relay4")) setRelay(4, data == "true");
  }
}

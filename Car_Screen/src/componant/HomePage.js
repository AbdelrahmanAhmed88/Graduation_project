import React, { useContext, useState, useEffect } from "react";
import { UserContext } from "./UserContext";
import "./HomePage.css";

// Images
import awake from "./image-home/awake.png";
import yawning from "./image-home/yawning-face.png";
import sleeping from "./image-home/sleeping-face.png";
import takeBreakImage from "./image-home/takeBreakImage.png";
import car from "./image-home/car.png";
import ellipse from "./image-home/Ellipse 1.png";
import alarm from "../assets/sounds/alarm.mp3"

import Sidebar from "./Sidebar";

// Capture vehicle/user IDs from URL
(function () {
  const params = new URLSearchParams(window.location.search);
  const user_id = params.get("u");
  const vehicle_id = params.get("v");
  if (vehicle_id) {
    sessionStorage.setItem("vehicleID", vehicle_id);
  }
  if (user_id) {
    sessionStorage.setItem("userID", user_id);
  }
})();

const playAlarm = () => {
  const audio = new Audio(alarm);
  audio.play().catch((error) => {
    console.error("Audio playback failed:", error);
  });
};

export default function HomePage() {
  const { userData } = useContext(UserContext);

  const [driverState, setDriverState] = useState("Awake");
  const [currentDriver, setCurrentDriver] = useState(() => {
    return JSON.parse(localStorage.getItem("recognizedUser")) || userData;
  });

  const [notification, setNotification] = useState("No Notifications");
  const [showBreakImage, setShowBreakImage] = useState(false);

  const [lightsState, setLightsState] = useState("OFF");
  const [lockState, setLockState] = useState("LOCKED");

  const getDriverImage = () => {
    if (showBreakImage) return takeBreakImage;
    switch (driverState) {
      case "AWAKE":
        return awake;
      case "DROWSY":
        return yawning;
      case "ASLEEP":
        return sleeping; // you can use a better "focused" image here
      default:
        return awake;
    }
  };

  useEffect(() => {
    const recognizedUser = JSON.parse(localStorage.getItem("recognizedUser"));
    if (recognizedUser) {
      setCurrentDriver(recognizedUser);
    }
  }, [userData]);

  useEffect(() => {
    if (driverState === "DROWSY") {
      // setNotification("⚠️ Warning! Driver is sleepy. Consider taking a break.");
      const timer = setTimeout(() => {
        setShowBreakImage(true);
        setNotification("⏳ You look tired. Consider taking a short break.");
      }, 30000);
      return () => clearTimeout(timer);
    }
    else if (driverState === "ASLEEP") {
      playAlarm();
    }
    else {
      setShowBreakImage(false);
      if (driverState === "alert") {
        setNotification("✅ Driver is focused and alert.");
      } else {
        setNotification("🚗 Driver is awake and driving.");
      }
    }
  }, [driverState]);

  // WebSocket connection
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");

    socket.onopen = () => {
      console.log("Connected to WebSocket server");
      socket.send("Screen connected"); // identify this client
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (!msg.type || !msg.message) return;

        switch (msg.type) {
          case "DROWSINESS_STATE":
            setDriverState(msg.message.toUpperCase());
            break;

          // case "distraction":
          //   setDriverState("awake"); // Or create a new "distracted" state
          //   setNotification(`⚠️ Distraction: ${msg.message}`);
          //   break;

          case "NOTIFICATION":
            setNotification(`${msg.message}`);
            break;

          default:
            setNotification(`ℹ️ ${msg.message}`);
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <div className="app-container">
      <Sidebar />
      <div className="homepage-container">
        {/* Left side - car */}
        <div className="car-container">
          <img src={car} alt="Car" className="car-image" />
          <p className="status-text">Lights {lightsState}</p>
          <p className="status-text">DOORS {lockState}</p>
        </div>

        {/* Right side - driver and notifications */}
        <div className="driver-info">
          <div className="driver-details">
            <div className="status-box">
              <img src={getDriverImage()} alt="Driver State" className="emoji-image" />
              <p className="status-text">
                {driverState.charAt(0).toUpperCase() + driverState.slice(1)}
              </p>
            </div>

            <div className="profilee-image-container">
              <img src={ellipse} alt="Frame" className="profilee-frame" />
              {currentDriver?.image ? (
                <img src={currentDriver.image} alt="Driver" className="profilee-image" />
              ) : (
                <p>No Image Available</p>
              )}
            </div>
          </div>

          <div className="notifications">
            <h3>Notifications</h3>
            <div className={`notification-item ${driverState === "yawning" ? "warning" : ""}`}>
              {notification}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

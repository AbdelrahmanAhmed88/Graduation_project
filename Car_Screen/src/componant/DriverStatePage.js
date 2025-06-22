import React, { useEffect, useState } from "react";
import "./DriverStatePage.css";
import './App.css';
import Sidebar from "./Sidebar";
import awakeImg from "./image-home/awake.png";
import yawningImg from "./image-home/yawning-face.png";
import sleepingImg from "./image-home/sleeping-face.png";
import takeBreakImage from "./image-home/takeBreakImage.png";

export default function DriverStatePage() {
  const [driverState, setDriverState] = useState("awake");
  const [drivingMinutes, setDrivingMinutes] = useState(0);

  useEffect(() => {
    const recognizedUser = JSON.parse(localStorage.getItem("recognizedUser"));
    if (recognizedUser?.state) {
      setDriverState(recognizedUser.state);
    }
    if (localStorage.getItem("drivingMinutes")) {
      setDrivingMinutes(parseInt(localStorage.getItem("drivingMinutes")));
    }
  }, []);

  const getStateImage = () => {
    switch (driverState) {
      case "awake":
        return awakeImg;
      case "yawning":
        return yawningImg;
      case "sleeping":
        return sleepingImg;
      case "take break":
        return takeBreakImage;
      default:
        return awakeImg;
    }
  };

  const getMainMessage = () => {
    switch (driverState) {
      case "awake":
        return "alert and focused";
      case "yawning":
        return "showing signs of fatigue";
      case "sleeping":
        return "asleep — immediate attention required!";
      case "take break":
        return "alert and focused";
      default:
        return "in normal condition";
    }
  };

  const getExtraMessage = () => {
    switch (driverState) {
      case "awake":
        return "✅ Keep up the good driving!";
      case "yawning":
        return "⚠️ You might need some rest soon.";
      case "sleeping":
        return "❌ Wake up! It’s dangerous to sleep while driving.";
      case "take break":
        return "⏳ What about taking a coffee break?";
      default:
        return "";
    }
  };

  const stateClass = driverState === "take break" ? "take-break" : driverState;

  return (
    <div className="app-container">
      <Sidebar />
  
      <div className="driver-state-box">
        <div className="driver-message">
          <p className="driver-status-label">Driver Status</p>

          <p>
            <span style={{ color: "#A16455" }}>➤ Driver is </span>
            <span className={`${stateClass}-msg`}>{getMainMessage()}</span>
          </p>

          <p>
            <span style={{ color: "#A16455" }}>➤ Driving for </span>
            <span className={`${stateClass}-msg`}>{drivingMinutes} hours</span>
          </p>

          <p className={`${stateClass}-msg`}> {getExtraMessage()}</p>
        </div>

        <div className="image-with-label">
          <img src={getStateImage()} alt="State" className="state-image-icon" />
          <p className="state-label">{driverState}</p>
        </div>
      </div>
    </div>
  );
}

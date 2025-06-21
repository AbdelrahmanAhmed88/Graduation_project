import React, { useEffect } from "react";
import "./DriverStateWindow.css";

import awakeImg from "./image-home/awake.png";
import yawningImg from "./image-home/yawning-face.png";
import sleepingImg from "./image-home/sleeping-face.png";
import takeBreakImage from "./image-home/takeBreakImage.png";

export default function DriverStateWindow({ state, onClose, startTime, drivingMinutes }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 10000); // تغلق بعد 10 ثواني
    return () => clearTimeout(timer);
  }, [onClose]);

  const getMessage = () => {
    switch (state) {
      case "awake":
        return "The driver is fully awake and focused.";
      case "yawning":
        return "⚠️ Driver is yawning. Signs of drowsiness detected.";
      case "sleeping":
        return "❌ The driver is sleeping! Immediate action is required.";
      case "take break":
        return "⏳ You've been driving too long. Please take a short break.";
      default:
        return "The driver is fully awake and focused.";
    }
  };

  const getExtraDetails = () => {
    switch (state) {
      case "take break":
        return `🕒 Driving for ${drivingMinutes} minutes. It's recommended to rest.`;
      case "yawning":
        return `Driving for ${drivingMinutes} minutes.`;
      case "sleeping":
        return `Driver has been inactive. Driving for ${drivingMinutes} minutes.`;
      case "awake":
        return `Driver started driving ${drivingMinutes} minutes ago.`;
      default:
        return `Driving for ${drivingMinutes} minutes.`;
    }
  };

  const getStateImage = () => {
    switch (state) {
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

  const formatStateName = () => {
    return state === "take break" ? "Break?" : state.charAt(0).toUpperCase() + state.slice(1);
  };

  return (
    <div className="state-modal">
      <div className="state-modal-content">
        <button className="close-button" onClick={onClose}>×</button>

        <div className="state-content-row">
          <div className="driver-message">
  <p className="driver-status-label">Driver Status</p>
  <p className={`${state}-msg`}>{getMessage()}</p>
</div>

          <div className="image-with-label">
            <img src={getStateImage()} alt="State" className="state-image-icon" />
            <p className="state-label">{formatStateName()}</p>
          </div>
        </div>

        <p className="extra-details">{getExtraDetails()}</p>
      </div>
    </div>
  );
}

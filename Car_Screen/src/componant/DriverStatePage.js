import React, { useEffect, useState,useRef } from "react";
import "./DriverStatePage.css";
import "./App.css";
import Sidebar from "./Sidebar";
import awakeImg from "./image-home/awake2.png";
import yawningImg from "./image-home/yawning-face.png";
import sleepingImg from "./image-home/sleeping-face.png";
import takeBreakImage from "./image-home/takeBreakImage.png";
import alarm from "../assets/sounds/alarm.mp3";
import { useWebSocket } from "../context/WebSocketContext";

export default function DriverStatePage() {
  const [driverState, setDriverState] = useState("AWAKE");
  const [drivingMinutes, setDrivingMinutes] = useState(0);
  const socketRef = useWebSocket();

  const [showWakePrompt, setShowWakePrompt] = useState(false);
  const [isClosingDisplay, setIsClosingDisplay] = useState(false);
  const [isFullyBlack, setIsFullyBlack] = useState(false);
  const alarmAudioRef = useRef(null);

  useEffect(() => {
    const recognizedUser = JSON.parse(localStorage.getItem("recognizedUser"));
    if (recognizedUser?.state) {
      setDriverState(recognizedUser.state);
    }
    if (localStorage.getItem("drivingMinutes")) {
      setDrivingMinutes(parseInt(localStorage.getItem("drivingMinutes")));
    }
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (!msg.type || !msg.message) return;

        switch (msg.type) {
          case "Control":
            if (msg.message === "ClOSEDISPLAY") {
              // Handle display close
            }
            break;
          case "DROWSINESS_STATE":
            setDriverState(msg.message.toUpperCase());
            if (msg.message.toUpperCase() === "ASLEEP") setShowWakePrompt(true);
            if (msg.notification) {
              sessionStorage.setItem("last_notification", msg.notification);
            }
            break;
          default:
            break;
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };
  }, [socketRef]);

  const playAlarm = () => {
    if (!alarmAudioRef.current) {
      alarmAudioRef.current = new Audio(alarm);
      alarmAudioRef.current.loop = true;
    }
    alarmAudioRef.current.play().catch(err => console.error("Alarm play failed:", err));
  };

  const stopAlarm = () => {
    if (alarmAudioRef.current) {
      alarmAudioRef.current.pause();
      alarmAudioRef.current.currentTime = 0;
    }
  };

    useEffect(() => {
    if (driverState === "ASLEEP") {
      playAlarm();
      setShowWakePrompt(true);
    }
  }, [driverState]);

  const handleWakeUp = () => {
    if (socketRef?.current?.readyState === WebSocket.OPEN) {
      stopAlarm();
      socketRef.current.send(JSON.stringify({ type: "DROWSINESS_STATE", message: "AWAKE" }));
      setDriverState("AWAKE");
      sessionStorage.setItem("DROWSINESS_STATE", "AWAKE");
      setShowWakePrompt(false);
    }
  };

  const getStateImage = () => {
    switch (driverState) {
      case "AWAKE":
        return awakeImg;
      case "DROWSY":
        return yawningImg;
      case "ASLEEP":
        return sleepingImg;
      case "BREAK":
        return takeBreakImage;
      default:
        return awakeImg;
    }
  };

  const getMainMessage = () => {
    switch (driverState) {
      case "AWAKE":
        return "alert and focused";
      case "DROWSY":
        return "looking tired";
      case "ASLEEP":
        return "asleep — needs attention!";
      case "BREAK":
        return "looking tired — time for a break";
      default:
        return "in normal condition";
    }
  };

  const getExtraMessage = () => {
    switch (driverState) {
      case "AWAKE":
        return "Keep up the good driving!";
      case "DROWSY":
        return "Feeling sleepy? A short break can help.";
      case "ASLEEP":
        return "";
      case "BREAK":
        return "Consider grabbing a coffee or stretching.";
      default:
        return "";
    }
  };

  return (
    <div className="app-container">
      <Sidebar />

      <div className="driver-state-box">
        <div className="driver-message">
          <h3 className="driver-status-label">Driver Status</h3>

          <h1>
            <span style={{ color: "#A16455" }}>Driver is </span>
            <span className={`${driverState}-msg`}>{getMainMessage()}</span>
          </h1>

          <h1>
            <span style={{ color: "#A16455" }}>Driving for </span>
            <span className={`${driverState}-msg`}>{drivingMinutes} hours</span>
          </h1>

          <h1 className={`${driverState}-msg`}>{getExtraMessage()}</h1>
        </div>

        <div className="image-with-label">
          <img
            src={getStateImage()}
            alt="Driver State"
            className={`state-image-icon ${driverState}-img`}
          />
          <p className="state-label">{driverState}</p>
        </div>
      </div>

      {showWakePrompt && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Are you awake?</h2>
            <p>Please confirm you're awake to continue.</p>
            <button className="confirm-button" onClick={handleWakeUp}>I'm Awake</button>
          </div>
        </div>
      )}

    </div>
  );
}

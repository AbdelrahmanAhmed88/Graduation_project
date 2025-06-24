import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "./UserContext";
import "./HomePage.css";
import Spline from '@splinetool/react-spline';

import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Suspense } from "react";

// Images
import awake from "./image-home/awake.png";
import yawning from "./image-home/yawning-face.png";
import sleeping from "./image-home/sleeping-face.png";
import takeBreakImage from "./image-home/takeBreakImage.png";
import car from "./image-home/car.png";
import ellipse from "./image-home/Ellipse 1.png";
import alarm from "../assets/sounds/alarm.mp3";

import Sidebar from "./Sidebar";

export default function HomePage() {
  const navigate = useNavigate();
  const { userData } = useContext(UserContext);

  const [driverState, setDriverState] = useState("AWAKE");
  const [currentDriver, setCurrentDriver] = useState(() => {
    return JSON.parse(localStorage.getItem("recognizedUser")) || userData;
  });

  const [notification, setNotification] = useState("No Notifications");
  const [showBreakImage, setShowBreakImage] = useState(false);
  const [lightsState, setLightsState] = useState("OFF");
  const [lockState, setLockState] = useState("LOCKED");
  const [profileImage, setProfileImage] = useState(null);
  const [showWakePrompt, setShowWakePrompt] = useState(false);
  const [socketRef, setSocketRef] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const user_id = params.get("u");
    const vehicle_id = params.get("v");

    if (vehicle_id) sessionStorage.setItem("vehicleID", vehicle_id);
    if (user_id) sessionStorage.setItem("userID", user_id);

    const savedState = sessionStorage.getItem("DROWSINESS_STATE");
    if (savedState) setDriverState(savedState);

    const lastNotification = sessionStorage.getItem("last_notification");
    if (lastNotification) setNotification(lastNotification);
  }, []);

  useEffect(() => {
    const userID = sessionStorage.getItem("userID");
    if (userID) {
      fetch(`http://localhost:5000/api/users/${userID}`)
        .then((response) => response.json())
        .then((data) => {
          setCurrentDriver(data.user);
          if (data.user.image) {
            const imageUrl = `http://localhost:5000/users/images/${data.user.image}`;
            setProfileImage(imageUrl);
          }
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
        });
    }
  }, []);

  let alarmAudio;

  const playAlarm = () => {
    if (!alarmAudio) {
      alarmAudio = new Audio(alarm);
      alarmAudio.loop = true;
    }
    alarmAudio.play().catch((error) => {
      console.error("Audio playback failed:", error);
    });
  };

  const stopAlarm = () => {
    if (alarmAudio) {
      alarmAudio.pause();
      alarmAudio.currentTime = 0; // rewind to start
    }
  };

  useEffect(() => {
  if (driverState === "ASLEEP") {
      playAlarm();
      setShowWakePrompt(true);
    }
  }, [driverState]);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");
    setSocketRef(socket);

    socket.onopen = () => {
      console.log("Connected to WebSocket server");
      socket.send("Screen connected");
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (!msg.type || !msg.message) return;

        switch (msg.type) {
          case "DROWSINESS_STATE":
            const state = msg.message.toUpperCase();
            setDriverState(state);
            sessionStorage.setItem("DROWSINESS_STATE", state);
            if (state === "ASLEEP") setShowWakePrompt(true);
            if (msg.notification) {
              setNotification(`${msg.notification}`);
              sessionStorage.setItem("last_notification", msg.notification);
            }
            break;
          case "NOTIFICATION":
            setNotification(`${msg.message}`);
            sessionStorage.setItem("last_notification", msg.message);
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

  const handleEmojiClick = () => {
    navigate("DriverState");
  };

  const handleProfileClick = () => {
    navigate("CurrentUser");
  };

  const getDriverImage = () => {
    switch (driverState) {
      case "AWAKE":
        return awake;
      case "DROWSY":
        return yawning;
      case "ASLEEP":
        return sleeping;
      case "BREAK":
        return takeBreakImage;
      default:
        return awake;
    }
  };

  const handleWakeUp = () => {
    if (socketRef && socketRef.readyState === WebSocket.OPEN) {
      socketRef.send(
        JSON.stringify({ type: "DROWSINESS_STATE", message: "AWAKE" })
      );
      setDriverState("AWAKE");
      sessionStorage.setItem("DROWSINESS_STATE", "AWAKE");
      stopAlarm();
      setShowWakePrompt(false);
    }
  };

  function CarModel() {
    const gltf = useGLTF("/models/2023_audi_nardo_rs_q8.glb");
    return (
      <primitive
        object={gltf.scene}
        scale={1.7}
        position={[0, -5, 0]} 
        rotation={[0, Math.PI, 0]}
      />
    );
  }
  

  return (
    <div className="app-container">
      <Sidebar />
      <div className="homepage-container">
      <div className="car-container">
      <Canvas
        style={{ height: "500px", width: "100%" }}
        camera={{ position: [100, 10, 100], fov: 11 }} // adjust position to zoom out
      >
        <ambientLight />
        <directionalLight position={[50, 50, 50]} />
        <Suspense fallback={null}>
          <CarModel />
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
        <p className="status-text">Lights {lightsState}</p>
        <p className="status-text">DOORS {lockState}</p>
      </div>


        <div className="driver-info">
          <div className="driver-details">
            <div className="status-box" onClick={handleEmojiClick}>
              <img
                src={getDriverImage()}
                alt="Driver State"
                className="emoji-image"
              />
              <p className="status-text">
                {driverState.charAt(0).toUpperCase() + driverState.slice(1)}
              </p>
            </div>

            <div
              className="profilee-image-container"
              onClick={handleProfileClick}
            >
              <img src={ellipse} alt="Frame" className="profilee-frame" />
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Driver"
                  className="profilee-image"
                />
              ) : (
                <p>No Image Available</p>
              )}
            </div>
          </div>

          <div className="notifications">
            <h3>Notifications</h3>
            <div
              className={`notification-item ${
                driverState === "YAWNING" ? "warning" : ""
              }`}
            >
              {notification}
            </div>
          </div>
        </div>
      </div>

      {showWakePrompt && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Are you awake?</h2>
            <p>Please confirm you're awake to continue.</p>
            <button className="confirm-button" onClick={handleWakeUp}>
              I'm Awake
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

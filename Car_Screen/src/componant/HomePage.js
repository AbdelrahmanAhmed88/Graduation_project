import React, { useContext, useState, useEffect, useRef } from "react";
import { UserContext } from "./UserContext";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import "./HomePage.css";
import awake from "./image-home/awake.png";
import yawning from "./image-home/yawning-face.png";
import sleeping from "./image-home/sleeping-face.png";
import takeBreakImage from "./image-home/takeBreakImage.png";
import ellipse from "./image-home/Ellipse 1.png";
import Sidebar from "./Sidebar";

// Immediately-invoked function to handle URL parameters
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

// Car3D Component to render 3D car model
function Car3D({ className, lightsState, lockState }) {
  const { scene } = useGLTF("/models/scene.gltf"); // Load GLTF model from public/models/
  const ref = useRef();

  // Auto-rotate the model
  useFrame(() => {
    ref.current.rotation.y += 0.01; // Adjust speed as needed
  });

  // Toggle headlight emissive based on lightsState
  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh && child.name.includes("headlight")) {
        child.material.emissive.set(lightsState === "ON" ? 0xffffff : 0x000000);
      }
    });
  }, [lightsState, scene]);

  // Optionally animate doors based on lockState
  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh && child.name.includes("door")) {
        child.rotation.y = lockState === "UNLOCKED" ? Math.PI / 4 : 0; // Example door animation
      }
    });
  }, [lockState, scene]);

  return (
    <Canvas className={className} camera={{ position: [0, 1, 5], fov: 75 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[0, 1, 1]} intensity={0.5} />
      <primitive ref={ref} object={scene} scale={[1, 1, 1]} rotation={[0, 0, 0]} />
      <OrbitControls enablePan={false} enableZoom={true} maxDistance={10} minDistance={2} />
    </Canvas>
  );
}

export default function HomePage() {
  const { userData } = useContext(UserContext);
  const [driverState, setDriverState] = useState("awake");
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
      case "awake":
        return awake;
      case "yawning":
        return yawning;
      case "alert":
        return sleeping;
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
    if (currentDriver?.name === "Admin") {
      setLightsState("ON");
      setLockState("LOCKED");
    } else {
      setLightsState("OFF");
      setLockState("UNLOCKED");
    }

    if (driverState === "yawning") {
      setNotification("⚠️ Warning! Driver is sleepy. Consider taking a break.");
      const timer = setTimeout(() => {
        setShowBreakImage(true);
        setNotification("⏳ You look tired. Consider taking a short break.");
      }, 30000);
      return () => clearTimeout(timer);
    } else {
      setNotification(
        driverState === "awake" ? "Driver is awake and ready." : "✅ Driver is alert and focused."
      );
      setShowBreakImage(false);
    }
  }, [currentDriver, driverState]);

  // WebSocket connection for real-time notifications
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:5000");

    socket.onopen = () => {
      const vehicleID = sessionStorage.getItem("vehicleID");
      if (vehicleID) {
        socket.send(JSON.stringify({ type: "subscribe", vehicle_id: vehicleID }));
      }
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.message) {
          setNotification(`🔔 ${msg.message}`);
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
        <div className="car-container">
          <Car3D className="car-image" lightsState={lightsState} lockState={lockState} />
          <p className="status-text">Lights {lightsState}</p>
          <p className="status-text">DOORS {lockState}</p>
        </div>
        <div className="driver-info">
          <div className="driver-details">
            <div className="status-box">
              <img src={getDriverImage()} alt="Driver State" className="emoji-image" />
              <p className="status-text">{driverState.charAt(0).toUpperCase() + driverState.slice(1)}</p>
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
import React, { useContext, useState, useEffect } from "react";
import { UserContext } from "./UserContext";
import "./HomePage.css";
import awake from "./image-home/awake.png"; // صورة السائق المستيقظ
import yawning from "./image-home/yawning-face.png"; // صورة السائق النعسان
import sleeping from "./image-home/sleeping-face.png"; // صورة السائق النائم
import takeBreakImage from "./image-home/takeBreakImage.png"; // صورة "خذ استراحة"
import car from "./image-home/car.png";
import ellipse from "./image-home/Ellipse 1.png";
import Sidebar from "./Sidebar";

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
    // تحديث بيانات السائق الحالي عند تغيير بيانات المستخدم
    const recognizedUser = JSON.parse(localStorage.getItem("recognizedUser"));

    if (recognizedUser) {
      setCurrentDriver(recognizedUser); // تحديث السائق الحالي ليكون الشخص الذي تم التعرف عليه
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
      setNotification(driverState === "awake" ? "Driver is awake and ready." : "✅ Driver is alert and focused.");
      setShowBreakImage(false);
    }
  }, [currentDriver, driverState]);

  //web socket connection for real-time notifications updates
  useEffect(()=>{
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

  },[]);

  

  return (
    <div className="app-container">
      <Sidebar />

      <div className="homepage-container">
        {/* ✅ السيارة في الجانب الأيسر */}
        <div className="car-container">
          <img src={car} alt="Car" className="car-image" />
          <p className="status-text">Lights {lightsState}</p>
          <p className="status-text">DOORS {lockState}</p>
        </div>

        {/*  السائق والإشعارات في الجانب الأيمن */}
        <div className="driver-info">
          {/*  جعل الإيموجي وصورة السائق بجانب بعض */}
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

          {/*  الإشعارات تحت الإيموجي وصورة السائق */}
          <div className="notifications">
            <h3>Notifications</h3>
            <div className={`notification-item ${driverState === "sleepy" ? "warning" : ""}`}>
              {notification}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

  import React, { useContext, useState, useEffect, Suspense, useRef } from "react";
  import { useNavigate } from "react-router-dom";
  import { UserContext } from "./UserContext";
  import "./HomePage.css";
  import { Canvas } from "@react-three/fiber";
  import { OrbitControls, useGLTF } from "@react-three/drei";
  import { motion, AnimatePresence } from "framer-motion";
  import Lottie from "lottie-react";

  // Assets
  import awake from "./image-home/awake.png";
  import yawning from "./image-home/yawning-face.png";
  import sleeping from "./image-home/sleeping-face.png";
  import takeBreakImage from "./image-home/takeBreakImage.png";
  import ellipse from "./image-home/Ellipse 1.png";
  import alarm from "../assets/sounds/alarm.mp3";
  import chime from "../assets/sounds/chime2.mp3";
  import master_profile_image from "../assets/images/master_profile_image.png";
  import Sidebar from "./Sidebar";

  // Emotions
  import angryImg from "../assets/images/Angry.png";
  import sadImg from "../assets/images/Sad.png";
  import fearImg from "../assets/images/fear.png";
  import joyImg from "../assets/images/Happy.png";
  import neutralImg from "../assets/images/Neutral.png";
  import focusedImg from "../assets/images/focused.png";
  import unfocusedImg from "../assets/images/unfocused.png";

  // Lottie
  import successSec from "../assets/border-success-secoundry.json";
  import success from "../assets/border-success.json";
  import warning from "../assets/border-warning.json";
  import danger from "../assets/border-danger.json";

  export default function HomePage() {
    const navigate = useNavigate();
    const { userData } = useContext(UserContext);
    const [driverState, setDriverState] = useState("AWAKE");
    const [currentDriver, setCurrentDriver] = useState(() => {
      return JSON.parse(localStorage.getItem("recognizedUser")) || userData;
    });
    const [notification, setNotification] = useState("No Notifications");
    const [lightsState, setLightsState] = useState("OFF");
    const [lockState, setLockState] = useState("UNLOCKED");
    const [profileImage, setProfileImage] = useState(null);
    const [showWakePrompt, setShowWakePrompt] = useState(false);
    const [showSadPrompt, setShowSadPrompt] = useState(false);
    const [showSafetyPrompt, setShowSafetyPrompt] = useState(false);
    const [socketRef, setSocketRef] = useState(null);
    const [userID, setUserID] = useState(() => sessionStorage.getItem("userID"));
    const [isIdentifying, setIsIdentifying] = useState(false);
    const [activeSection, setActiveSection] = useState("homepage");

    // Right side
    const [score, setScore] = useState(10);
    const [emotion, setEmotion] = useState("neutral");
    const [focus, setFocus] = useState("focused");

    const [isClosingDisplay, setIsClosingDisplay] = useState(false);
    const [isFullyBlack, setIsFullyBlack] = useState(false);

    const alarmAudioRef = useRef(null);
    const chimeAudioRef = useRef(null);

    const playChime = () => {
      if (!chimeAudioRef.current) {
        chimeAudioRef.current = new Audio(chime);
      }
      chimeAudioRef.current.play().catch(err => console.error("Audio play failed:", err));
    }

    const playAlarm = () => {
      if (!alarmAudioRef.current) {
        alarmAudioRef.current = new Audio(alarm);
        alarmAudioRef.current.loop = true;
      }
      alarmAudioRef.current.play().catch(err => console.error("Audio play failed:", err));
    };

    const stopAlarm = () => {
      if (alarmAudioRef.current) {
        alarmAudioRef.current.pause();
        alarmAudioRef.current.currentTime = 0;
      }
    };


    useEffect(() => {
      if (isClosingDisplay) {
        const timer = setTimeout(() => {
          setIsFullyBlack(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }, [isClosingDisplay]);

    const getEmotionImage = () => {
      switch (emotion) {
        case "angry": return angryImg;
        case "sad": return sadImg;
        case "fear": return fearImg;
        case "happy": return joyImg;
        case "neutral": return neutralImg;
        default: return null;
      }
    };

    const getFocusImage = () => {
      return focus === "focused" ? focusedImg : unfocusedImg;
    };

    const getScoreAnimation = () => {
      if (score === 10) return successSec;
      else if (score < 10 && score >= 7) return success;
      else if (score < 7 && score > 3) return warning;
      else return danger;
    };

    useEffect(() => {
      const userID = sessionStorage.getItem("userID");
      if (userID === "Master") {
        setCurrentDriver({ name: "Master", speed_limit: false, max_speed: 220 });
        setProfileImage(master_profile_image);
      } else if (userID) {
        fetch(`http://localhost:5000/api/users/${userID}`)
          .then(res => res.json())
          .then(data => {
            setCurrentDriver(data.user);
            if (data.user.image) {
              setProfileImage(`http://localhost:5000/users/images/${data.user.image}`);
            }
          })
          .catch(err => console.error("Error fetching user:", err));
      }
    }, [userID]);

    useEffect(() => {
      if (driverState === "ASLEEP") {
        playAlarm();
        setShowWakePrompt(true);
      }
    }, [driverState]);

    useEffect(() => {
      const socket = new WebSocket("ws://localhost:8080");
      setSocketRef(socket);

      socket.onopen = () => socket.send("Screen connected");

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (!msg.type || !msg.message) return;
          console.log(msg);
          switch (msg.type) {
            case "Control":
              playChime();
              if (msg.message === "ClOSEDISPLAY") {
                setIsFullyBlack(false);
                setIsClosingDisplay(true);
              }
              if (msg.message === "STARTDISPLAY") {
                setIsClosingDisplay(false);
                setIsFullyBlack(false);
              }
              break;

            case "USERCREDENTIALS":
              playChime();
              if (msg.message === "IDENTIFYING") {
                setIsClosingDisplay(false);
                setIsIdentifying(true);
              } else {
                const id = msg.message;
                sessionStorage.setItem("userID", id);
                setUserID(id);
                setIsIdentifying(false);
              }
              break;
            
            case "ASSISTANCE":
              if (msg.message === "SAFETY") {
                setShowSafetyPrompt(true);
              } else {
                
              }

            case "DROWSINESS_STATE":
              playChime();
              const state = msg.message.toUpperCase();
              setDriverState(state);
              sessionStorage.setItem("DROWSINESS_STATE", state);
              if (state === "ASLEEP") setShowWakePrompt(true);
              if (msg.notification) {
                setNotification(msg.notification);
                sessionStorage.setItem("last_notification", msg.notification);
              }
              break;

            case "EMOTIONS_STATE":
              setEmotion(msg.message.toLowerCase());
              if(msg.message.toLowerCase() === "sad") setShowSadPrompt(true);
              if (msg.notification) {
                setNotification(msg.notification);
                sessionStorage.setItem("last_notification", msg.notification);
              }
              break;

            case "DISTRACTED_STATE":
              playChime();
              setFocus(msg.message.toLowerCase());
              if (msg.notification) {
                setNotification(msg.notification);
                sessionStorage.setItem("last_notification", msg.notification);
              }
              break;

            case "DRIVING_SCORE":
              setScore(msg.message);
              break;

            case "NOTIFICATION":
              setNotification(msg.message);
              sessionStorage.setItem("last_notification", msg.message);
              break;

            default:
              setNotification(`ℹ️ ${msg.message}`);
          }
        } catch (err) {
          console.error("WebSocket parse error:", err);
        }
      };

      socket.onerror = (error) => console.error("WebSocket error:", error);
      return () => socket.close();
    }, []);

    const handleEmojiClick = () => navigate("DriverState");
    const handleProfileClick = () => navigate("CurrentUser");

    const getDriverImage = () => {
      switch (driverState) {
        case "AWAKE": return awake;
        case "DROWSY": return yawning;
        case "ASLEEP": return sleeping;
        case "BREAK": return takeBreakImage;
        default: return awake;
      }
    };

    const handleLockAndUnlockClick = () => {
      if (socketRef?.readyState === WebSocket.OPEN) {
        const newState = lockState === "LOCKED" ? "UNLOCKED" : "LOCKED";
        setLockState(newState);
        socketRef.send(JSON.stringify({ type: "LOCK_STATE", message: newState }));
      }
    };

    const handleWakeUp = () => {
      if (socketRef?.readyState === WebSocket.OPEN) {
        stopAlarm();
        socketRef.send(JSON.stringify({ type: "DROWSINESS_STATE", message: "AWAKE" }));
        setDriverState("AWAKE");
        sessionStorage.setItem("DROWSINESS_STATE", "AWAKE");
        setShowWakePrompt(false);
      }
    };

    const handleSadMode = () => {
      if (socketRef?.readyState === WebSocket.OPEN) {
        stopAlarm();
        socketRef.send(JSON.stringify({ type: "EMOTIONS_STATE", message: "SADMODE" }));
        sessionStorage.setItem("EMOTIONS_STATE", "SAD");
        setShowSadPrompt(false);
      }
    };

    const toggleSection = () => {
      setActiveSection(activeSection === "homepage" ? "status" : "homepage");
    };

    function CarModel() {
      const gltf = useGLTF("/models/2023_audi_nardo_rs_q8.glb");
      return <primitive object={gltf.scene} scale={1.7} position={[0, -5, 0]} rotation={[0, Math.PI, 0]} />;
    }

    return (
      <div className="app-container">
        <Sidebar lockState={lockState} handleLockAndUnlockClick={handleLockAndUnlockClick} toggleSection={toggleSection} />
        <div className="content-wrapper">
          <AnimatePresence mode="wait">
            {activeSection === "homepage" ? (
              <motion.div
                key="homepage"
                className="homepage-container"
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "-100%", opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="car-container">
                  <Canvas style={{ height: "500px", width: "100%" }} camera={{ position: [100, 10, 100], fov: 11 }}>
                    <ambientLight />
                    <directionalLight position={[50, 50, 50]} />
                    <Suspense fallback={null}><CarModel /></Suspense>
                    <OrbitControls enableZoom={false} enablePan={false} />
                  </Canvas>
                  <p className="status-text">Lights {lightsState}</p>
                  <p className="status-text">DOORS {lockState}</p>
                </div>

                <div className="driver-info">
                  <div className="driver-details">
                    <div className="emoji-box" onClick={handleEmojiClick}>
                      <img src={getDriverImage()} alt="Driver State" className="emoji-image" />
                      <p className="status-text">{driverState.charAt(0).toUpperCase() + driverState.slice(1)}</p>
                    </div>

                    <div className="profilee-image-container" onClick={handleProfileClick}>
                      <img src={ellipse} alt="Frame" className="profilee-frame" />
                      {profileImage ? (
                        <img src={profileImage} alt="Driver" className="profilee-image" />
                      ) : <p>No Image Available</p>}
                    </div>
                  </div>

                  <div className="notifications">
                    <h3>Notifications</h3>
                    <div className={`notification-item ${driverState === "YAWNING" ? "warning" : ""}`}>
                      {notification}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="status"
                className="status-summary-container"
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "-100%", opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div className="status-box" initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
                  <h3>Driver Score</h3>
                  <div className="lottie-container">
                    <Lottie animationData={getScoreAnimation()} loop autoplay />
                    <div className="lottie-score">{score ?? "N/A"}</div>
                  </div>
                </motion.div>

                <motion.div className="status-box" initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
                  <h3>Emotion Tracker</h3>
                  <div className={`emotion-section emotion-${emotion || "neutral"}`}>
                    <p className="emotion-text">Driver seems {emotion?.toUpperCase() || "N/A"}</p>
                    {getEmotionImage() ? <img src={getEmotionImage()} alt={emotion} className="status-img" /> : <p>No Emotion</p>}
                  </div>
                </motion.div>

                <motion.div className="status-box" initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
                  <h3>Distraction</h3>
                  <p className="focus-text">{focus?.toUpperCase() || "N/A"}</p>
                  {getFocusImage() ? <img src={getFocusImage()} alt={focus} className="status-img" /> : <p>No Data</p>}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
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

      {showSafetyPrompt && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Driving Assistance Activated</h2>
              <p>We've detected signs of anger and your safety score is currently low.</p>
              <p>For your safety, the speed limit has been reduced to 60 km/h.</p>
              <button className="confirm-button" onClick={() => setShowSafetyPrompt(false)}>Understood</button>
            </div>
          </div>
        )}

        {showSadPrompt && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Activate Sad Mode?</h2>
              <p>Are you sure you want to start Sad Mode? This action may change your experience.</p>
              <div className="modal-buttons">
                <button className="confirm-button" onClick={handleSadMode}>
                  Yes, Start Sad Mode
                </button>
                <button className="cancel-button" onClick={() => setShowSadPrompt(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}


        {isIdentifying && (
          <div className="loading-screen-overlay">
            <div className="loading-modal">
              <h2>Identifying user...</h2>
              <p>Please wait while we identify the current driver.</p>
            </div>
          </div>
        )}

        {isClosingDisplay && (
          <div className={`closing-screen-overlay ${isFullyBlack ? "fully-black" : ""}`}>
            {!isFullyBlack && (
              <div className="closing-modal">
                <Lottie animationData={successSec} loop={false} autoplay />
                <p>Shutting down display...</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
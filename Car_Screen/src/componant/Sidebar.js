import "./Sidebar.css";
import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  FaUser,
  FaLightbulb,
  FaCog,
  FaHome,
  FaFan,
  FaLock,
  FaHandPaper,
} from "react-icons/fa";
import alertIcon from "./Hazard Warning Flasher.png";

const Sidebar = () => {
  const [showSettings, setShowSettings] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <button className="alert-button">
        <img src={alertIcon} alt="Alert" className="alert-icon" />
      </button>

      <div className="sidebar">
        <ul>
          <li>
            <Link to="/Firsttimelogin2/Firsttimelogin3/HomePage/CurrentUser">
              <FaUser className="icon" />
            </Link>
          </li>
          <li>
            <Link to="#Lightbulb">
              <FaLightbulb className="icon" />
            </Link>
          </li>

          <li className="dropdown-container" ref={dropdownRef}>
            <div className="icon" onClick={() => setShowSettings(!showSettings)}>
              <FaCog className="icon" />
            </div>
            <ul className={`dropdown ${showSettings ? "show" : ""}`}>
              <li>
                <Link to="/Firsttimelogin2/Firsttimelogin3/HomePage/ChangeAdminInfo">
                  Change Admin Info
                </Link>
              </li>
              <li>
                <Link to="/Firsttimelogin2/Firsttimelogin3/HomePage/UserProfile">
                  Adding New User
                </Link>
              </li>
              <li>
                <Link to="/Firsttimelogin2/Firsttimelogin3/HomePage/ShowAllUsers">
                  Show All Users
                </Link>
              </li>
            </ul>
          </li>

          <li>
            <Link to="/Firsttimelogin2/Firsttimelogin3/HomePage">
              <FaHome className="icon" />
            </Link>
          </li>
          <li>
            <Link to="#Fan">
              <FaFan className="icon" />
            </Link>
          </li>
          <li>
            <Link to="#Lock">
              <FaLock className="icon" />
            </Link>
          </li>
          <li>
            <Link to="#HandGesture">
              <FaHandPaper className="icon" />
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
};

export default Sidebar;

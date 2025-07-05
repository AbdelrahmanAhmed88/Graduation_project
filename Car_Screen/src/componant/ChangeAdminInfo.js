import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import "./UserProfile.css";
import master_profile_image from "../assets/images/master_profile_image.png";

export default function ChangeAdminInfo() {
  const [image, setImage] = useState(master_profile_image);
  const [user_id, setUserID] = useState(null);
  const [isMaster, setIsMaster] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState({
    speedLimit: "false",
    maxSpeed: "",
    aggressive: "false",
    drowsiness: "false",
    focus: "false",
  });

  useEffect(() => {
    const userID = sessionStorage.getItem("userID");
    setUserID(userID);
    if (userID === "Master") {
      setIsMaster(true);
    }
  }, [user_id]);

  useEffect(() => {
    const savedData = localStorage.getItem("AdminData");
    if (savedData) {
      setFormData(JSON.parse(savedData));
    }
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdateAdminData = () => {
    localStorage.setItem("AdminData", JSON.stringify(formData));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="app-container">
      <Sidebar />

      {!isMaster ? (
        <div className="unauthorized-container">
          <h2>🔒 Access Limited</h2>
          <p>Adding or editing users is only allowed with the Master Card</p>
        </div>
      ) : (
        <div className="profile-container">
          <div className="profile-left">
            <img src={image} alt="Admin" className="profile-imagee" />
            <label className="user_name">Master</label>
          </div>

          <div className="separator"></div>

          <div className="profile-right">
            <div className="info-container">
              <div className="info-row">
                <span className="info-label">Speed Limit</span>
                <select
                  name="speedLimit"
                  value={formData.speedLimit}
                  onChange={handleInputChange}
                  className="info-select"
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              </div>

              <div className="info-row">
                <span className="info-label">Max Speed</span>
                <input
                  type="text"
                  name="maxSpeed"
                  value={formData.maxSpeed}
                  onChange={handleInputChange}
                  className="info-input"
                  placeholder="Enter Max Speed KM/H"
                />
              </div>

              {[
                { label: "Aggressive Driving", name: "aggressive" },
                { label: "Drowsiness", name: "drowsiness" },
                { label: "Focus", name: "focus" },
              ].map((field) => (
                <div key={field.name} className="info-row">
                  <span className="info-label">{field.label}</span>
                  <select
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleInputChange}
                    className="info-select"
                  >
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                </div>
              ))}
            </div>

            <button className="button" onClick={handleUpdateAdminData}>
              Save
            </button>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="success-message">
          Admin settings saved successfully!
        </div>
      )}
    </div>
  );
}

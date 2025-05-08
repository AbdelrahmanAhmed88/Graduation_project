import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import "./UserProfile.css";

export default function CurrentUser() {
  const [image, setImage] = useState(null);
  const [userData, setUserData] = useState(null);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
  
      const storedUserID = sessionStorage.getItem("userID");
      if (!storedUserID) {
        setUnauthorized(true);
        return;
      }
      
      fetch(`http://localhost:5000/api/users/${storedUserID}`)
        .then((response) =>{
          if(!response.ok){
            throw new Error("User not found");
          }
          return response.json();
        })
        .then((data) => {
          const user = data.user;
          if(user){   
            setUserData(user);
            setImage(user.image);
          } else {
            setUnauthorized(true);
          }
        }).catch(() => {
          setUnauthorized(true);
        });
  }, []);
  
  useEffect(() => {
    if (userData) {
      console.log("Updated userData:", userData);
    }
  }, [userData]);

  return (
    <div className="app-container">
      <Sidebar />
      
      {unauthorized ? (
        <div className="unauthorized-container">
          <h2>🚫 Unauthorized to Use the Car!</h2>
          <p>This user is not authorized to drive the car.</p>
        </div>
      ) : (
        <div className="profile-container">
          <div className="profile-left">
            {image ? <img src={`http://localhost:5000/users/images/${image}`} alt="User" className="profile-imagee" /> : <p>No Image</p>}
            <h2 className="input-field">{userData?.name}</h2>
          </div>
          <div className="separator"></div>
          <div className="profile-right">
            <div className="info-container">
              <div className="info-row">
                <span className="info-label">NFC ID</span>
                <span className="info-value">{userData?.nfc_id}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Speed Limit</span>
                <span className="info-value">{userData?.speed_limit ? "Enabled" : "Disabled"}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Max Speed</span>
                <span className="info-value">{userData?.max_speed} KM/H</span>
              </div>
              <div className="info-row">
                <span className="info-label">Aggressive Driving</span>
                <span className="info-value">{userData?.aggressive_mode ? "Enabled" : "Disabled"}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Drowsiness</span>
                <span className="info-value">{userData?.drowsiness_mode ? "Enabled" : "Disabled"}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Focus</span>
                <span className="info-value">{userData?.focus_mode ? "Enabled" : "Disabled"}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

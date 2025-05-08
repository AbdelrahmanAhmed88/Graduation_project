import { useEffect, useState } from "react";
import "./UserProfile.css"; 
import Sidebar from "./Sidebar";

export default function ShowAllUsers() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const storedVehicleID = sessionStorage.getItem("vehicleID");

    fetch(`http://localhost:5000/api/vehicles/${storedVehicleID}`)
      .then((response) => {
        if(!response.ok){
          throw new Error("Vehicle not found");
        }
        return response.json();
      })
      .then((data) => {
        const users = data.vehicle.users;
        console.log(data.vehicle.users)
        setUsers(users);
      })

    
  }, []);

  const handleDeleteUser = (index) => {
    const deletedUser = users[index];
    const updatedUsers = users.filter((_, i) => i !== index);
    setUsers(updatedUsers);
    localStorage.setItem("users", JSON.stringify(updatedUsers));
  
    // تحقق مما إذا كان المستخدم المحذوف هو نفسه المخزن في recognizedUser
    const recognizedUser = JSON.parse(localStorage.getItem("recognizedUser"));
    if (recognizedUser && recognizedUser.nfc === deletedUser.nfc) {
      localStorage.removeItem("recognizedUser"); // إزالة المستخدم من localStorage
    }
  
    setSelectedUser(null);
  };
  

  const handleSelectUser = (userID) => {
    fetch(`http://localhost:5000/api/users/${userID}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("User not found");
        }
        return response.json();
      })
      .then((data) => {
        if (data.user) {
          console.log(data.user);
          setSelectedUser(data.user);
        } else {
          console.error("Invalid user data:", data);
        }
      })
      .catch((error) => console.error("Error fetching user details:", error));
  };

  return (
    <div className="app-container">
      <Sidebar />

      {!selectedUser ? (
        <div>
          {users.length === 0 ? (
            <p className="no-users">No users found.</p>
          ) : (
            <div className="user-list-container">
              <ul className="user-list">
                {users.map((user, index) => (
                  <li 
                    key={index} 
                    className="user-item" 
                    onClick={() => handleSelectUser(user.user_id)}
                  >
                    {user.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="profile-container">
          <div className="profile-left">
            {selectedUser.image && <img src={`http://localhost:5000/users/images/${selectedUser.image}`} alt="Driver" className="profile-imagee" />}
          </div>

          <div className="separator"></div>

          <div className="profile-right">
            <div className="info-container">
              <div className="info-row">
                <span className="info-label">Name</span>
                <span className="info-value">{selectedUser.name}</span>
              </div>

              <div className="info-row">
                <span className="info-label">NFC ID</span>
                <span className="info-value">{selectedUser.nfc_id}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Speed Limit</span>
                <span className="info-value">{selectedUser.speed_limit ? "Enabled" : "Disabled"}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Max Speed</span>
                <span className="info-value">{selectedUser.max_speed} KM/H</span>
              </div>

              <div className="info-row">
                <span className="info-label">Aggressive Driving</span>
                <span className="info-value">{selectedUser.aggressive_mode ? "Enabled" : "Disabled"}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Drowsiness</span>
                <span className="info-value">{selectedUser.drowsiness_mode ? "Enabled" : "Disabled"}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Focus</span>
                <span className="info-value">{selectedUser.focus_mode ? "Enabled" : "Disabled"}</span>
              </div>

              <div className="button-container" style={{display:"flex"}}> 
                <button className="button" onClick={() => handleDeleteUser(users.indexOf(selectedUser))}>Delete</button>
                <button className="button" onClick={() => setSelectedUser(null)}>Back</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
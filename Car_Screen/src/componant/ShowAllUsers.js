import { useEffect, useState } from "react";
import "./UserProfile.css"; 
import Sidebar from "./Sidebar";

export default function ShowAllUsers() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [errors, setErrors] = useState({});
  const [user_id, setUserID] = useState(null);
  const [isMaster, setIsMaster] = useState(false);

    useEffect(() => {
    const storedUsers = JSON.parse(localStorage.getItem("users")) || [];
    setUsers(storedUsers);
  }, []);

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

    useEffect(() =>{
    const userID = sessionStorage.getItem("userID");
    setUserID(userID);
    if(userID === "Master")
    {
      setIsMaster(true);
    }
  },[user_id]);


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

  //editing users
    const handleEdit = () => {
    setEditData({ ...selectedUser });
    setIsEditing(true);
    setErrors({});
  };

  const handleInputChange = (field, value) => {
    setEditData({ ...editData, [field]: value });
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditData({ ...editData, image: reader.result });
      setErrors((prev) => ({ ...prev, image: "" }));
    };
    if (file) reader.readAsDataURL(file);
  };

  const handleSaveEdit = () => {
    const requiredFields = ["name", "nfc", "maxSpeed", "aggressive", "drowsiness", "focus"];
    const newErrors = {};

    requiredFields.forEach(field => {
      if (!editData[field] || editData[field].toString().trim() === "") {
        newErrors[field] = "This field is required";
      }
    });

    if (!editData.image) {
      newErrors.image = "Image is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const updatedUsers = users.map(user =>
      user.nfc === selectedUser.nfc ? editData : user
    );
    setUsers(updatedUsers);
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    localStorage.setItem("recognizedUser", JSON.stringify(editData));
    setSelectedUser(editData);
    setIsEditing(false);
  };
  
return (
  <div className="app-container">
    <Sidebar />

    {!isMaster ? (
      <div className="unauthorized-container">
        <h2>🔒 Access Limited</h2>
        <p>Adding or editing users is only allowed with the Master Card</p>
      </div>
    ) : !selectedUser ? (
      <div>
        {users.length === 0 ? (
          <p className="no-users">No users found.</p>
        ) : (
          <div className="user-list-container">
            <ul className="user-list">
              {users.map((user) => (
                <li
                  key={user.user_id}
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
          {isEditing ? (
            <>
              {editData.image && (
                <img
                  src={`http://localhost:5000/users/images/${editData.image}`}
                  alt="Driver"
                  className="profile-imagee"
                />
              )}
              <input type="file" accept="image/*" onChange={handleImageUpload} />
              {errors.image && <div className="error-text">{errors.image}</div>}
            </>
          ) : (
            selectedUser.image && (
              <img
                src={`http://localhost:5000/users/images/${selectedUser.image}`}
                alt="Driver"
                className="profile-imagee"
              />
            )
          )}
        </div>

        <div className="separator"></div>

        <div className="profile-right">
          <div className="info-container">
            {[
              { key: "name", label: "Name", type: "text" },
              { key: "max_speed", label: "Max Speed", type: "number" },
              { key: "speed_limit", label: "Speed Limit", type: "boolean" },
              { key: "aggressive_mode", label: "Aggressive Driving", type: "boolean" },
              { key: "drowsiness_mode", label: "Drowsiness", type: "boolean" },
              { key: "focus_mode", label: "Focus", type: "boolean" },
            ].map(({ key, label, type }) => (
              <div className="info-row" key={key}>
                <span className="info-label">{label}</span>
                {isEditing ? (
                  type === "boolean" ? (
                    <select
                      className="info-select"
                      value={editData[key] ? "true" : "false"}
                      onChange={(e) =>
                        handleInputChange(key, e.target.value === "true")
                      }
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  ) : (
                    <input
                      type={type}
                      className="info-input"
                      value={editData[key]}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                    />
                  )
                ) : (
                  <span className="info-value">
                    {type === "boolean"
                      ? selectedUser[key]
                        ? "Enabled"
                        : "Disabled"
                      : key === "max_speed"
                      ? `${selectedUser[key]} KM/H`
                      : selectedUser[key]}
                  </span>
                )}
                {errors[key] && <div className="error-text">{errors[key]}</div>}
              </div>
            ))}

            <div className="button-container" style={{ display: "flex", gap: "10px" }}>
              {isEditing ? (
                <>
                  <button className="button" onClick={handleSaveEdit}>Save</button>
                  <button className="button" onClick={() => setIsEditing(false)}>Cancel</button>
                </>
              ) : (
                <>
                  <button className="button" onClick={handleEdit}>Edit</button>
                  <button className="button" onClick={() => handleDeleteUser(selectedUser.user_id)}>Delete</button>
                  <button className="button" onClick={() => setSelectedUser(null)}>Back</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);

}
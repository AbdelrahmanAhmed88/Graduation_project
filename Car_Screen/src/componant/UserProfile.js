import { useState, useEffect } from "react";
import "./UserProfile.css";
import Sidebar from "./Sidebar";

function generateUserID() {
  const prefix = "USR";
  const uniqueNumber = Math.floor(1000000000 + Math.random() * 9000000000); // Generates a 10-digit number
  return prefix + uniqueNumber;
}

export default function UserProfile() {
  const [image, setImage] = useState(null);
  const [user_id, setUserID] = useState(null);
  const storedVehicleID = sessionStorage.getItem("vehicleID");
  const [isMaster, setIsMaster] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    // nfc_id: "",
    speed_limit: false, 
    max_speed: "",
    aggressive_mode: false, 
    drowsiness_mode: false, 
    focus_mode: true, 
  });

  useEffect(() =>{
    const userID = sessionStorage.getItem("userID");
    setUserID(userID);
    if(userID === "Master")
    {
      setIsMaster(true);
    }
  },[user_id]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  //  دالة تحميل الصورة وتحويلها إلى Base64
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setImage(reader.result); // حفظ الصورة بصيغة Base64
      };
    }
  };

  const handleSaveUser = async () => {
    if (formData.name && image) {
      // Generate a unique user ID
      const userID = generateUserID();
  
      // Extract file extension from Base64 string
      const fileExtension = image.split(";")[0].split("/")[1]; 
      const fileName = `${userID}.${fileExtension}`;
  
      // Convert Base64 to Blob
      const base64Data = image.split(",")[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: `image/${fileExtension}` });
  
      // Prepare image data
      const formDataImage = new FormData();
      formDataImage.append("image", blob, fileName);
  
      try {
        const imageUploadResponse = await fetch("http://localhost:5000/upload", {
          method: "POST",
          body: formDataImage,
        });
  
        const imageUploadData = await imageUploadResponse.json();
  
        if (imageUploadData.imageFile) {
          // Save user data after the image upload is successful
          const userData = { ...formData,user_id: userID,image: fileName };
  
          const userResponse = await fetch("http://localhost:5000/api/users", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
          });

          const vehicleResponse = await fetch("http://localhost:5000/api/vehicles/users", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({vehicle_id: storedVehicleID,name:formData.name,user_id:userID}),
          });
  
          const userDataResponse = await userResponse.json();
  
          if (userDataResponse.status === "Success") {
            alert("User saved successfully!");
            // Reset the form
            setFormData({
              name: "",
              // nfc_id: "",
              speed_limit: false,
              max_speed: "",
              aggressive_mode: false,
              drowsiness_mode: false,
              focus_mode: true,
            });
            setImage(null);
          }
        } else {
          alert("Failed to upload image.");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Failed to save user.");
      }
    } else {
      alert("Please enter all data and upload an image.");
    }
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
          {/*  عرض الصورة المحفوظة أو زر التحميل */}
          {image ? (
            <img src={image} alt="Driver" className="profile-imagee" />
          ) : (
            <label className="upload-label">
              +
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          )}

          {/*  إدخال اسم المستخدم */}
          <input
            type="text"
            name="name"
            placeholder="Enter Name"
            value={formData.name}
            onChange={handleInputChange}
            className="input-field"
          />
        </div>

        <div className="separator"></div>

        <div className="profile-right">
          <div className="info-container">
            {/* <div className="info-row">
              <span className="info-label">nfc_id ID</span>
              <input
                type="text"
                name="nfc_id"
                value={formData.nfc_id}
                onChange={handleInputChange}
                className="info-input"
                placeholder="Enter nfc_id ID"
              />
            </div> */}

            <div className="info-row">
              <span className="info-label">Speed Limit</span>
              <select name="speed_limit" value={formData.speed_limit} onChange={handleInputChange} className="info-select">
                <option value={true}>Enabled</option>
                <option value={false}>Disabled</option>
              </select>
            </div>

            <div className="info-row">
              <span className="info-label">Max Speed</span>
              <input
                type="text"
                name="max_speed"
                value={formData.max_speed}
                onChange={handleInputChange}
                className="info-input"
                placeholder="Enter Max Speed KM/H"
              />
            </div>

            {/*  الحقول الخاصة بالمؤشرات الأخرى */}
            {[
              { label: "Aggressive Driving", name: "aggressive_mode" },
              { label: "Drowsiness", name: "drowsiness_mode" },
              { label: "Focus", name: "focus_mode" }
            ].map((field) => (
              <div key={field.name} className="info-row">
                <span className="info-label">{field.label}</span>
                <select name={field.name} value={formData[field.name]} onChange={handleInputChange} className="info-select">
                  <option value={true}>Enabled</option>
                  <option value={false}>Disabled</option>
                </select>
              </div>
            ))}
          </div>

        
          <button className="button" onClick={handleSaveUser}>Save</button>
        </div>
      </div>
      )}
    </div>
  );
}

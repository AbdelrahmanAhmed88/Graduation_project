import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "./UserContext";
import "./FirstTimeLogin.css";
import "./App.css";

function FirstTimeLogin3() {
  const navigate = useNavigate();
  const { userData, setUserData } = useContext(UserContext);

  const [preview, setPreview] = useState(userData.image || null);


  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    const userID = localStorage.getItem("userID"); // Retrieve userID
  
    if (file && file.type.startsWith("image/")) {
      const fileExtension = file.name.split('.').pop(); // Extract file extension
      const fileName = userID + "." + fileExtension; // Use userID as filename
  
      const formData = new FormData();
      formData.append("image", file, fileName); // Append file with correct filename
      formData.append("userID", userID); // Send userID separately

      try {
        const response = await fetch("http://localhost:5000/upload", {
          method: "POST",
          body: formData,
        });
  
        const data = await response.json();
        if (response.ok) {
          const imageUrl = URL.createObjectURL(file);
          setPreview(imageUrl);
          setUserData({ ...userData, image: imageUrl }); // Save file path
          //alert("succ");
        } else {
          alert(data.error || "File upload failed");
        }
      } catch (error) {
        console.error("Upload error:", error);
        alert("Error uploading file");  
      }
    } else {
      alert("Please upload a valid image file.");
    }
  };
  


  const handleContinue = () => {
    if (!preview) {
      alert("Please upload an image before continuing.");
    } else {
      navigate("HomePage");
    }
  };

  return (
    <div className="app-container">
      <div className="card">
        <h2 className="title">Upload your face image</h2>
        <p className="description">Ensure the photo is focused on your face.</p>
        <div className="upload-box">
          {preview ? <img src={preview} alt="Preview" className="image-preview" /> : <label htmlFor="file-input" className="upload-icon">+</label>}
          <input type="file" id="file-input" onChange={handleFileChange} style={{ display: "none" }} accept="image/*" />
        </div>
        <button className="button" onClick={handleContinue}>Continue</button>
      </div>
    </div>
  );
}

export default FirstTimeLogin3;

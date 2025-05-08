import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import "./UserProfile.css";

export default function ChangeAdminInfo() {
  const [image, setImage] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    nfc: "",
    speedLimit: "Activated",
    maxSpeed: "",
    aggressive: "No",
    drowsiness: "No",
    focus: "Yes",
  });

  useEffect(() => {
    fetch("http://localhost:5000/admin")
      .then((response) => response.json())
      .then((data) => {
        if (data) {
          console.log("Fetched Admin Data:", data);
          setFormData({
            name: data.name || "",
            nfc: data.nfc || "",
            speedLimit: data.speedLimit || "Activated",
            maxSpeed: data.maxSpeed || "",
            aggressive: data.aggressive || "No",
            drowsiness: data.drowsiness || "No",
            focus: data.focus || "Yes",
          });
          if (data.image) setImage(data.image);
          localStorage.setItem("adminData", JSON.stringify(data));
        }
      })
      .catch((error) => console.error("Error fetching admin data:", error));
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImage(imageUrl);
      localStorage.setItem("adminData", JSON.stringify({ ...formData, image: imageUrl }));
    }
  };

  const handleSaveUser = () => {
    if (!formData.name.trim() || !formData.nfc.trim() || !formData.maxSpeed.trim() || !image) {
      alert("Please enter all data.");
      return;
    }

    const updatedAdmin = { ...formData, image };

    fetch("http://localhost:5000/admin/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedAdmin),
    })
      .then((response) => response.json())
      .then(() => {
        alert("Admin information updated successfully!");
        localStorage.setItem("adminData", JSON.stringify(updatedAdmin));
      })
      .catch((error) => console.error("Error updating admin data:", error));
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="profile-container">
        <div className="profile-left">
          {image ? (
            <img src={image} alt="Admin" className="profile-imagee" />
          ) : (
            <label className="upload-label">
              +
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          )}
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
            <div className="info-row">
              <span className="info-label">NFC ID</span>
              <input type="text" name="nfc" value={formData.nfc} onChange={handleInputChange} className="info-input" placeholder="Enter NFC ID" />
            </div>

            <div className="info-row">
              <span className="info-label">Speed Limit</span>
              <select name="speedLimit" value={formData.speedLimit} onChange={handleInputChange} className="info-select">
                <option value="Activated">Activated</option>
                <option value="Not Activated">Not Activated</option>
              </select>
            </div>

            <div className="info-row">
              <span className="info-label">Max Speed</span>
              <input type="text" name="maxSpeed" value={formData.maxSpeed} onChange={handleInputChange} className="info-input" placeholder="Enter Max Speed KM/H" />
            </div>

            {[{ label: "Aggressive Driving", name: "aggressive" }, { label: "Drowsiness", name: "drowsiness" }, { label: "Focus", name: "focus" }].map((field) => (
              <div key={field.name} className="info-row">
                <span className="info-label">{field.label}</span>
                <select name={field.name} value={formData[field.name]} onChange={handleInputChange} className="info-select">
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            ))}
          </div>

          <button className="button" onClick={handleSaveUser} >Save</button>
        </div>
      </div>
    </div>
  );
}

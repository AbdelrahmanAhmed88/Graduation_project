import React, { useState ,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./FirstTimeLogin.css";
import "./App.css";


function FirstTimeLogin2() {
  const navigate = useNavigate();

  // Separate states for each input
  const [vehicle_id , setVehicleID] = useState("");
  const [car_model , setCarModel] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const vid = sessionStorage.getItem("vehicleID");
    const carModel = sessionStorage.getItem("carModel");

    if (vid) setVehicleID(vid);
    if (carModel) setCarModel(carModel);
  }, []);

  // Handlers for each input field
  const handleNameChange = (event) => setName(event.target.value);
  const handlePhoneChange = (event) => setPhone(event.target.value);
  const handleEmailChange = (event) => setEmail(event.target.value);
  const handlePasswordChange = (event) => setPassword(event.target.value);


  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || !email.trim()) {
      alert("Please fill in all fields.");
    } else {
      // Prepare data to send in the API request
      const userData = {
        vehicle_id,
        car_model,
        admin: {
          name,
          phone_number: phone,
          email: email.toLowerCase(),
          password
        }
      };

      try {
        // Send the POST request to create a new vehicle (no need to include vehicleID)
        const response = await fetch("http://localhost:5000/api/vehicles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        });

        const data = await response.json();

        if (response.ok && data.status === "Success") {
          //alert("Vehicle created successfully!");
          navigate("Firsttimelogin3"); // Navigate to next page after successful creation
        } else {
          alert("Error creating vehicle. Please try again.");
        }
      } catch (error) {
        console.error("Error submitting vehicle data:", error);
        alert("Error creating vehicle. Please try again.");
      }
    }
  };

  return (
    <div className="app-container">
      <div className="card">
        <label className="label">Enter your name</label>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          className="input"
          onChange={handleNameChange}
        />

        <label className="label">Enter your phone number</label>
        <input
          type="text"
          placeholder="Phone number"
          value={phone}
          className="input"
          onChange={handlePhoneChange}
        />

        <label className="label">Enter your Email</label>
        <input
          type="text"
          placeholder="Email"
          value={email}
          className="input"
          onChange={handleEmailChange}
        />
        <label className="label">Enter your Password</label>
        <label className="labelNote">*Ensure you can recognize this password for future user additions.*</label>
        <input
          type="password"
          placeholder="Password"
          value={password}
          className="input"
          onChange={handlePasswordChange}
        />

        <button className="button" onClick={handleSubmit}>
          Continue
        </button>
      </div>
    </div>
  );
}

export default FirstTimeLogin2;

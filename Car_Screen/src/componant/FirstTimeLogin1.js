import { useNavigate } from "react-router-dom";
import React from "react";
import "./FirstTimeLogin.css";
import './App.css';

(function () {
  const params = new URLSearchParams(window.location.search);
  const vehicle_id = params.get("v");
  const car_model = params.get("c");
  if (vehicle_id) {
    sessionStorage.setItem("vehicleID", vehicle_id);
  }
  if (car_model) {
    sessionStorage.setItem("carModel", car_model);
  }
})();

function FirstTimeLogin1() {
  
  const navigate = useNavigate(); // لتفعيل التنقل بين الصفحات

  const handleContinue = () => {
    navigate("Firsttimelogin2"); // الانتقال إلى المسار المطلوب
  };
  return (
    
    <div className="app-container">
    
    
    <div className="card">
      <p>
        "Welcome to your car's intelligent operating system! To provide you
        with a personalized and secure driving experience, we need to set up
        your admin profile. This will include your name and image, ensuring
        exclusive access and tailored functionalities. Let’s get started and
        unlock the full potential of your smart car!"
      </p>
      <button className="button" onClick={handleContinue}> Continue </button>
    </div>
    </div>
    
  );
}

export default FirstTimeLogin1;

const mongoose = require("mongoose");

// Define the schema
const vehicleSchema = new mongoose.Schema({
  vehicle_id: { 
    type: String, 
    required: true, 
    unique: true 
    }, // Unique Car ID
  car_model: {
    type: String, 
    required: true 
    }, // Car Model

  admin: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone_number: { type: String, required: true },
    password: { type: String, required: true }
  },

  currentDriver:{
    user_id: { type: String, required: false ,default: null},
    start_time: { type: Date, required: false ,default: null },
    drowsiness_state: { type: String, required: false ,default: null },
    focus_state: { type: String, required: false ,default: null },
  },

  users: [
    {
      name: { type: String, required: true },
      // role: { type: String, enum: ["admin", "user"], required: true }, // Role: owner/user
      user_id: { type: String, required: true }
    }
  ],
  
  
});


// Create and export the model
const vehicle = mongoose.model("Vehicles", vehicleSchema);
module.exports = vehicle;

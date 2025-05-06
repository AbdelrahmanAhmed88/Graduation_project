const mongoose = require('mongoose');

// Define the User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    user_id:{type: String,required: true,unique: true},
    nfc_id: { type: String, required: true, unique: true }, 
    image: { type: String, required: true }, // Image URL

    // Driving preferences & settings
    speed_limit: { type: Boolean, default: false }, 
    max_speed: { type: Number, required: true, min: 0, max: 300 }, 
    aggressive_mode: { type: Boolean, default: false }, 
    drowsiness_mode: { type: Boolean, default: false }, 
    focus_mode: { type: Boolean, default: true } 
});

module.exports = mongoose.model('Users', userSchema);

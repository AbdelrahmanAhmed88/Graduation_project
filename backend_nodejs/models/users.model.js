const mongoose = require('mongoose');

// Define the User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    user_id:{type: String,required: true,unique: true},
    nfc_id: { type: String, required: true, unique: true }, 
    image: { type: String, required: true }, // Image URL

    // Driving preferences & settings
    speed_limit: { type: Boolean, default: false }, 
    max_speed: { type: Number, required: false, min: 0, max: 300 , default: 220 }, 
    aggressive_mode: { type: Boolean, default: false },
    drowsiness_mode: { type: Boolean, default: false }, 
    focus_mode: { type: Boolean, default: true },

    //score
    driving_score: { type: Number, default: 10 },
    punishment: {type: Boolean, default: false}
});

module.exports = mongoose.model('Users', userSchema);

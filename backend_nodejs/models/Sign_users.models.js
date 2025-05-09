const mongoose = require('mongoose');

// Define the User Schema
const userSchema = new mongoose.Schema({
    FullName: { type: String, required: true },
    Email: { type: String, required: true },
    Password: { type: String, required: true },
})

module.exports = mongoose.model('SUser', userSchema);
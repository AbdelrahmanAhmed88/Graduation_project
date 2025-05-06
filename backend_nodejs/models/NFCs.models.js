const mongoose = require('mongoose');

// Define the NFC Schema and Model
const nfcSchema = new mongoose.Schema({
    nfc_id: { 
        type: String, 
        required: true },
    status: { 
        type: String, 
        required: true },
    vehicle_id: { 
        type: String, 
        required: true }
});

module.exports = mongoose.model('Nfc_cards',nfcSchema);
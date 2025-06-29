const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  vehicle_id: { type: String, required: true },
  message_title: { type: String, required: true },
  message: { type: String, required: false },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);

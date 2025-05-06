require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const WebSocket = require('ws');
const Message = require('./models/message.models');
const fs = require('fs');
const notificationRoutes = require('./routers/notificationsRoutes')

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const NFC_URL = process.env.NFC_DB_URL;

mongoose.connect(NFC_URL).then(() => {
    console.log("MongoDB server started");
});

// Route imports
app.use('/api/nfcs', require('./routers/nfcRoutes'));
app.use('/api/users', require('./routers/userRoutes'));
app.use('/api/vehicles', require('./routers/vehicleRoutes'));
app.use('/', require('./routers/uploadRoutes'));
app.use('/api/notification', require('./routers/notificationsRoutes'));

const server = app.listen(5000, () => {
    console.log('Server running on http://localhost:5000');
});
//startListening();
// WebSocket Server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  //console.log('WebSocket client connected');

  // Wait for client to send subscription info
  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data);

      if (msg.type === 'subscribe') {
        // ✅ Store vehicle_id on this connection
        ws.vehicle_id = msg.vehicle_id;
        return;
      }

      // If it's a real message from Python
      if (msg.vehicle_id && msg.message) {
        // Save to DB (optional)
        await Message.create({
          vehicle_id: msg.vehicle_id,
          message: msg.message
        });

        // ✅ Broadcast only to matching vehicle_id
        wss.clients.forEach((client) => {
          if (
            client.readyState === WebSocket.OPEN &&
            client.vehicle_id === msg.vehicle_id
          ) {
            client.send(JSON.stringify(msg));
          }
        });
      }

    } catch (err) {
      console.error('WebSocket error:', err.message);
    }
  });
});

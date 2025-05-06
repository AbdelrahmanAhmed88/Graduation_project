const Message = require('../models/message.models');
const mongoose = require('mongoose');
const getallmessages = async (req, res) => {
    try {
      const messages = await Message.find();
      res.json({ status: "success", data: messages });
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  };

const getmessagebyid = async (req, res) => {
    const { vehicle_id } = req.params;
  
    // Check if ID format is valid (assuming it's a MongoDB ObjectId)
    // if (!mongoose.Types.ObjectId.isValid(vehicle_id)) {
    //   return res.status(400).json({ status: "error", message: "Bad Request: Invalid vehicle ID format" });
    // }
  
    try {
      const messages = await Message.find({ vehicle_id });
  
      if (messages.length === 0) {
        return res.status(404).json({ status: "fail", message: "No messages found for this vehicle ID" });
      }
  
      res.status(200).json({ status: "success", data: messages });
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  };

  const deleteallmessages = async (req, res) => {
    try {
      await Message.deleteMany();
      res.json({ status: "success", data: { message: "All messages deleted" } });
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  };

const deletemessagebyid = async (req, res) => {
    const { vehicle_id } = req.params;
  
    // if (!mongoose.Types.ObjectId.isValid(vehicle_id)) {
    //   return res.status(400).json({ status: "error", message: "Bad Request: Invalid vehicle ID format" });
    // }
  
    try {
      const result = await Message.deleteMany({ vehicle_id });
  
      if (result.deletedCount === 0) {
        return res.status(404).json({ status: "fail", message: "No messages found to delete for this vehicle ID" });
      }
  
      res.status(200).json({
        status: "success",
        data: { message: `Messages from vehicle ${vehicle_id} deleted` },
      });
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  };
module.exports = {
    getallmessages,
    getmessagebyid,
    deleteallmessages,
    deletemessagebyid
}
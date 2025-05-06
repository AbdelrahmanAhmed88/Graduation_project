const express = require('express');
const router = express.Router();
const {
    getallmessages,
    getmessagebyid,
    deleteallmessages,
    deletemessagebyid
  } = require('../controllers/notificationController');
const Message = require('../models/message.models');

// GET all messages
router.get('/', getallmessages);

// GET messages by vehicle_id
router.get('/:vehicle_id', getmessagebyid);

// DELETE all messages
router.delete('/', deleteallmessages);

// DELETE messages by vehicle_id
router.delete('/:vehicle_id', deletemessagebyid);


module.exports = router;

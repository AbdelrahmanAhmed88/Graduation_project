const express = require('express');
const router = express.Router();
const { getAllNFCs, getSingleNFC } = require('../controllers/nfcController');

router.get('/', getAllNFCs);
router.get('/:nfcID/:vehicleID', getSingleNFC);

module.exports = router;

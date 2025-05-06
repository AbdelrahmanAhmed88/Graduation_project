const express = require('express');
const router = express.Router();
const {
    registerVehicle,
    getVehicle,
    getRequestedVehicleID,
    addUserToVehicle,
    getVehicleUsers
} = require('../controllers/vehicleController');

router.post('/', registerVehicle);
router.get('/reqVID', getRequestedVehicleID);
router.get('/:vehicle_id', getVehicle);
router.post('/users', addUserToVehicle);
router.get('/:vehicle_id/usersID', getVehicleUsers);

module.exports = router;

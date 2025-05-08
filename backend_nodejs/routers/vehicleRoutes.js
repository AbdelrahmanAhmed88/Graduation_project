const express = require('express');
const bycrypt = require('bcrypt');
const router = express.Router();
const {
    registerVehicle,
    getVehicle,
    getRequestedVehicleID,
    addUserToVehicle,
    getVehicleUsers,
    deleteUserFromVehicle
} = require('../controllers/vehicleController');

router.post('/', registerVehicle);
router.get('/reqVID', getRequestedVehicleID);
router.get('/:vehicle_id', getVehicle);
router.post('/users', addUserToVehicle);
router.delete('/:vehicleId/users/:userId', deleteUserFromVehicle);
router.get('/:vehicle_id/usersID', getVehicleUsers);

module.exports = router;

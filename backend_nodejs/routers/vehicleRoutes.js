const express = require('express');
const router = express.Router();
const {
    registerVehicle,
    getVehicle,
    getRequestedVehicleID,
    addUserToVehicle,
    getVehicleUsers,
    deleteUserFromVehicle,
    loginAdmin,
    editUserName
} = require('../controllers/vehicleController');

router.post('/', registerVehicle);
router.get('/reqVID', getRequestedVehicleID);
router.get('/:vehicle_id', getVehicle);
router.post('/users', addUserToVehicle);
router.delete('/:vehicleId/users/:userId', deleteUserFromVehicle);
router.get('/:vehicle_id/usersID', getVehicleUsers);
router.post('/login', loginAdmin);
router.patch('/:vehicleId/users/:usersID', editUserName); 

module.exports = router;

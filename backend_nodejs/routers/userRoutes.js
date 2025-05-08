const express = require('express');
const router = express.Router();
const { getAllUsers, getUser, updateUser, createUser, deleteUser } = require('../controllers/userController');

router.get('/', getAllUsers);
router.get('/:userID', getUser);
router.patch('/:userID', updateUser);
router.post('/', createUser);
router.delete('/:userID', deleteUser);

module.exports = router;

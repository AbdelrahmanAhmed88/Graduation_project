const express = require('express');
const router = express.Router();
const { getAllUsers, getUser, updateUser, createUser } = require('../controllers/userController');

router.get('/', getAllUsers);
router.get('/:userID', getUser);
router.patch('/:userID', updateUser);
router.post('/', createUser);

module.exports = router;

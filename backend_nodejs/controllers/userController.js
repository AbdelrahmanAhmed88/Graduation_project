const USER = require('../models/users.model');
exports.getAllUsers = async (req, res) => {
    try {
        const users = await USER.find({}, { "__V": false });
        res.json(users);
    } catch (err) {
        res.status(500).send("Error retrieving users: " + err);
    }
};

exports.getUser = async (req, res) => {
    try {
        const user = await USER.findOne({ user_id: req.params.userID });
        if (!user) {
            return res.status(404).json({ status: "FAIL", message: "User ID not found" });
        }
        return res.json({ user });
    } catch (err) {
        return res.status(500).json({ error: "Internal server error" });
    }
};

exports.updateUser = async (req, res) => {
    try {

        // console.log(req);
        const updatedUser = await USER.findOneAndUpdate(
            { user_id: req.params.userID },
            { $set: { ...req.body } },
            { new: true }
        );
        if (!updatedUser) {
            return res.status(404).json({ status: "FAIL", message: "User ID not found" });
        }
        return res.json({ status: "Success", message: "User updated successfully", user: updatedUser });
    } catch (err) {
        return res.status(500).json({ error: "Internal server error" });
    }
};

exports.createUser = async (req, res) => {
    const {user_id} = req.body;
    if (!user_id) {
        return res.status(400).json({ status: "FAIL", message: "Please enter all fields" });
    }
    const existingUser = await USER.findOne({ user_id });
    if (existingUser) {
        return res.status(201).json({ status: "Success", message: "User already exists" });
    }
    const newUser = new USER(req.body);
    await newUser.save();
    return res.status(201).json({ status: "Success", data: { user: newUser } });
};

exports.deleteUser = async (req, res) => {
    try {
        const deletedUser = await USER.findOneAndDelete({ user_id: req.params.userID });
        if (!deletedUser) {
            return res.status(404).json({ status: "FAIL", message: "User ID not found" });
        }
        return res.json({ status: "Success", message: "User deleted successfully", user: deletedUser });
    } catch (err) {
        return res.status(500).json({ error: "Internal server error" });
    }
};
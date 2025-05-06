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
        const updatedUser = await USER.findOneAndUpdate(
            { user_id: req.params.userID },
            { $set: { ...req.body } }
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
    const newUser = new USER(req.body);
    await newUser.save();
    res.status(201).json({ status: "Success", data: { user: newUser } });
};

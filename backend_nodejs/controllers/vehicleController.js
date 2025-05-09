const VEHICLE = require('../models/vehicles.models');
const bycrypt = require('bcrypt');
const saltRounds = 10;

exports.registerVehicle = async (req, res) => {

    const { vehicle_id, car_model ,admin} = req.body;
    if (!vehicle_id || !car_model ||!admin) {
        return res.status(400).json({ status: 'FAIL', message: 'Missing required fields' });
    }
    const hashedPassword = await bycrypt.hash(admin.password, saltRounds);

    const newVehicle = new VEHICLE({
        vehicle_id,
        car_model,
        admin: {
            ...admin,
            password: hashedPassword
        }
    });

    try {
        await newVehicle.save();
        return res.status(201).json({ status: "Success", data: { vehicle: newVehicle } });
    } catch (error) {
        return res.status(500).json({ status: "FAIL", message: "Internal server error" });
    }
};

exports.getVehicle = async (req, res) => {
    const vehicle = await VEHICLE.findOne({ vehicle_id: req.params.vehicle_id });
    if (!vehicle) {
        return res.status(404).json({ status: 'FAIL', message: 'Vehicle not found' });
    }
    return res.json({ vehicle });
};

exports.getRequestedVehicleID = (req, res) => {
    const vID = vehicleData.vehicleID;
    if (!vID) {
        return res.status(400).json({ status: 'FAIL', message: 'Vehicle ID is missing' });
    }
    return res.json(vID);
};

exports.addUserToVehicle = async (req, res) => {
    try {
        const { vehicle_id, name, user_id } = req.body;
        if (!vehicle_id || !name || !user_id) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const vehicle = await VEHICLE.findOne({ vehicle_id });
        if (!vehicle) {
            return res.status(404).json({ success: false, message: "Vehicle not found" });
        }

        if (!Array.isArray(vehicle.users)) {
            vehicle.users = [];
        }

        const userExists = vehicle.users.some(user => user.user_id === user_id);
        if (userExists) {
            return res.status(400).json({ success: false, message: "User already exists for this vehicle" });
        }

        await VEHICLE.updateOne(
            { vehicle_id },
            { $push: { users: { name, user_id } } }
        );

        return res.status(200).json({ success: true, message: "User added successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

exports.deleteUserFromVehicle = async (req, res) => {
    const { vehicleId, userId } = req.params;
  
    try {
      const result = await VEHICLE.findOneAndUpdate(
        { vehicle_id: vehicleId },
        { $pull: { users: { user_id: userId } } },
        { new: true } // return the updated document
      );
  
      if (!result) {
        return res.status(404).json({ success: false, message: "Vehicle not found" });
      }
  
      return res.status(200).json({
        success: true,
        message: "User removed successfully",
        vehicle: result
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  };
  

exports.setVehicleAdmin = async (req, res) => {
    try {
        const { vehicle_id, name, email, phone_number} = req.body;
        if (!vehicle_id || !name || !email || !phone_number) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const vehicle = await VEHICLE.findOne({ vehicle_id });
        if (!vehicle) {
            return res.status(404).json({ success: false, message: "Vehicle not found" });
        }

                // Set or update the admin data
        vehicle.admin = {
            name,
            email,
            phone_number
        };
        await vehicle.save(); // Save is better than updateOne for complete document update

        return res.status(200).json({ success: true, message: "Admin set successfully" })
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

exports.getVehicleUsers = async (req, res) => {
    try {
        const { vehicle_id } = req.params;
    
        if (!vehicle_id) {
          return res.status(400).json({ success: false, message: "Missing vehicle ID" });
        }
    
        const vehicle = await VEHICLE.findOne({ vehicle_id });
    
        if (!vehicle) {
          return res.status(404).json({ success: false, message: "Vehicle not found" });
        }
    
        // Extract only user_id from each user
        const userIds = (vehicle.users || []).map(user => user.user_id);
    
        return res.status(200).json({ success: true, users: userIds });
    
      } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ success: false, message: "Internal server error"});
  }  
}
exports.loginAdmin = async (req, res) => {
    const { vehicle_id, Email, Password } = req.body;
    if (!Email || !Password ||!vehicle_id) {
      return res.status(404).json({ msg: "Please enter all fields" });
    }
    try {
      const vehicle = await VEHICLE.findOne({ 'vehicle_id' : vehicle_id });
      if (!vehicle) {
        return res.status(404).json({ msg: "Vehicle does not exist" });
      }
      const isMatch = await bycrypt.compare(Password, vehicle.admin.password);
      if (!isMatch) {
        return res.status(404).json({ success: false, credentials: "unmatched" });
      }
      return res.status(200).json({ success: true, credentials: "matched" });
    }
    catch (err) {
      res.status(500).json({ error: err.message });
    }
    }


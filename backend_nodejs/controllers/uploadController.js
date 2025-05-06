const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../user_images");

exports.handleUpload = (req, res) => {
    const imageFile = req.file;
    res.json({ message: "File uploaded successfully!", imageFile });
};

exports.getImage = (req, res) => {
    const imagePath = path.join(uploadDir, req.params.filename);
    if (fs.existsSync(imagePath)) {
        res.sendFile(imagePath);
    } else {
        res.status(404).json({ message: "Image not found" });
    }
};

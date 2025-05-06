const express = require('express');
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { handleUpload, getImage } = require('../controllers/uploadController');

const uploadDir = path.join(__dirname, "../user_images");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

router.post("/upload", upload.single("image"), handleUpload);
router.get("/users/images/:filename", getImage);

module.exports = router;

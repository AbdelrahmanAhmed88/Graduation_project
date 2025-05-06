const NFC = require('../models/NFCs.models');

exports.getAllNFCs = async (req, res) => {
    try {
        const nfcs = await NFC.find({}, { "__V": false });
        res.json(nfcs);
    } catch (err) {
        res.status(500).send("Error retrieving NFC data: " + err);
    }
};

exports.getSingleNFC = async (req, res) => {
    try {
        const { nfcID, vehicleID } = req.params;
        const nfc = await NFC.findOne({ nfc_id: nfcID, vehicle_id: vehicleID });
        if (!nfc) {
            return res.status(404).json({ status: "FAIL", message: "This NFC ID doesn't belong to this car or it doesn't exist" });
        }
        return res.json({ nfc });
    } catch (err) {
        return res.status(500).json({ error: "Internal server error" });
    }
};

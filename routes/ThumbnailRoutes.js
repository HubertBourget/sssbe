const express = require("express");
const router = express.Router();
const { CreateImageThumbnail } = require("../controllers/ThumbnailController");

router.post("/createImageThumbnail", CreateImageThumbnail);

module.exports = router;
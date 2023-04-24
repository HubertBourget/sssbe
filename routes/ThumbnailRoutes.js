const express = require("express");
const router = express.Router();
const { CreateImageThumbnail, SyncCatalog } = require("../controllers/ThumbnailController");

router.post("/createImageThumbnail", CreateImageThumbnail);
router.post("/syncCatalog", SyncCatalog);

module.exports = router;
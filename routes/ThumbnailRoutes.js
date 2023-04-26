const express = require("express");
const router = express.Router();
const { CreateImageThumbnail, SyncCatalog, CreateThumbnailOfAllBucketVideoes, uploadVideo } = require("../controllers/ThumbnailController");

router.post("/createImageThumbnail", CreateImageThumbnail);
router.post("/syncCatalog", SyncCatalog);
router.post("/allVideo/createImageThumbnail", CreateThumbnailOfAllBucketVideoes);
router.post("/uploadVideo", uploadVideo);

module.exports = router;
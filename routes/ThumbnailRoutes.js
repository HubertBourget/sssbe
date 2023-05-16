const express = require("express");
const router = express.Router();
const multer  = require('multer');
const upload = multer({ dest: 'Uploads/' });
const { 
    CreateImageThumbnail, 
    CreateThumbnailOfAllBucketVideoes, 
    UploadVideo,
    EncodeCreds,
    DecodeCreds,
} = require("../controllers/ThumbnailController");

/**
 * @description This method will take video_url and time_marks(on which second of video we want to create a thumbnail) as an arguments and then first of all it will download the video locally by using the request package. then it will create a thumbnail and will store that thumbnail to the google cloud storage. and at last also will delete the video which downloaded locally.
 * @param, time_marks, video_url (body)
 * @returns This will return success message while other processes like creating thumbnail and upload to GCS will be run in background
 */
router.post("/createImageThumbnail", CreateImageThumbnail);

/**
 * @description This method will download video locally and then will upload video to the google cloud storage and at last it will delete downloaded video.
 * @param, video_url (body)
 * @returns This will return success message while other processes like download and upload video to the google cloud storage will be run in background.
 */
router.post("/uploadVideo", upload.single("video_url"), UploadVideo);

/**
 * @description This method will download credentials file locally and then will encode the data and will return encoded data.
 * @param, creds (body : form-data), credentials file of GCS should be pass
 * @returns This will return success message with encoded data of GCS file.
 */
router.post("/encodeCreds", multer({ dest: 'GCS-creds' }).single("creds"), EncodeCreds);

/**
 * @description This method will decode the data and will return decoded data.
 * @param, encoded - String (body)
 * @returns This will return success message with decoded data of encoded string which is passed threw body.
 */
router.post("/decodeCreds", DecodeCreds);

/**
 * @description This method will get all the video url from google cloud storage, then will download one by one and will create thumbnail from their video and will upload to the google cloud storage.
 * @param, teme_marks(on which second of video we want to create a thumbnail) (body)
 * @returns This will return success message while other processes like creating thumbnail and upload to GCS will be run in background
 */
router.post("/allVideo/createImageThumbnail", CreateThumbnailOfAllBucketVideoes);

module.exports = router;
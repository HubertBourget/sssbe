const fs = require("fs");
const fse = require("fs-extra");
const request = require("request");
const { StoreAndUpload } = require("../utils/StoreVideoAndCreateThumbnail");
const path = require("path");
const { bucket, thumbnailDir } = require("../utils/constants");

/**
 * @method POST
 * @route "/createImageThumbnail"
 * @description This method will take video_url and time_marks(on which second of video we want to create a thumbnail) as an arguments and then first of all it will download the video locally by using the request package. then it will create a thumbnail and will store that thumbnail to the google cloud storage. and at last also will delete the video which downloaded locally.
 * @param, time_marks, video_url (body)
 * @returns This will return success message while other processes like creating thumbnail and upload to GCS will be run in background
 */
const CreateImageThumbnail = async function(req, res) {
    try {
        // get video link and capture time from body
        const { 
            video_url, 
            time_marks = ["1"],
        } = req.body;

        if (!video_url) {
            return res.status(400).json({
                err: true,
                error: "Please provide video url!!",
            });
        }

        // we want one directory for store thumbnails locally so if directory not exist then create one
        if (!fs.existsSync(thumbnailDir)){
            fs.mkdirSync(thumbnailDir);
        }

        // store video locally then create thumbnails and then store new thumbnails to the GCS
        let data = await StoreAndUpload(video_url, time_marks);

        if (data.err) {
            return res.status(400).json({
                err: true,
                error: data.error,
            })
        }

        return res.status(200).json({
            msg: "success",
            data: {
                thumbnails: data.data,
            }
        });
    } catch (err) {
        console.log('Err in File-ThumbnailController > Method-CreateImageThumbnail > : ', err);
        return res.status(400).json({
            err: true,
            error: err,
        });
    }
};
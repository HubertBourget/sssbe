const fs = require("fs");
const dir = './Thumbnails';
const fse = require("fs-extra");
const request = require("request");
const { RecombeeSync } = require("../utils/RecombeeSync");
const { StoreAndUpload } = require("../utils/StoreVideoAndCreateThumbnail");
const { Storage } = require('@google-cloud/storage');
const path = require("path");
const serviceKey = path.join(__dirname, '../utils/sacred-sound-2a7ce18e134a.json');
  
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
            })
        }

        // we want one directory for store thumbnails locally so if directory not exist then create one
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        // store video locally then create thumbnails and then store new thumbnails to the GCS
        await StoreAndUpload(video_url, time_marks);

        return res.status(200).json({
            msg: "success"
        });
    } catch (err) {
        console.log('err : ', err);
        return res.status(400).json({
            err: true,
            error: err,
        });
    }
};


/**
 * @method POST
 * @route "/syncCatalog"
 * @description This method will take Ids of all the users and approved videoes from the database. Then it will add new users and videoes(items) to the recombee.
 * @param, No need to pass any params or body
 * @returns This will return success message while other processes like get Ids from database and sync it with the recombee will be run in background.
 */
const SyncCatalog = async function (req, res) {
    try {
        // sync our database with the recombee platform
        RecombeeSync();
        return res.status(200).json({
            msg: "Data syncing successfully."
        });
    } catch (err) {
        console.log('err : ', err);
        return res.status(400).json({
            msg: "err",
            err: err,
        })
    }
};

/**
 * @method POST
 * @route "/allVideo/createImageThumbnail"
 * @description This method will get all the video url from google cloud storage, then will download one by one and will create thumbnail from their video and will upload to the google cloud storage.
 * @param, time_marks(on which second of video we want to create a thumbnail) (body)
 * @returns This will return success message while other processes like creating thumbnail and upload to GCS will be run in background
 */
const CreateThumbnailOfAllBucketVideoes = async (req, res) => {
    try {
        // get capture time from body
        const { time_marks = ["1"] } = req.body;    // if we want to capture 2 thumbnails on 1st and 5th second then time_marks = ["1", "5"]

        // create instance of storage
        const storage = new Storage({
            keyFilename: serviceKey,
            projectId: process.env.PROJECT_ID,
        });    

        // getting bucket name and folder name in which our video will be store
        const bucketName = process.env.BUCKET_NAME;
        const folder = process.env.BUCKET_VIDEO_FOLDER;

        // getting all the media links of videoes which are stored in specific folder in bucket
        const [files] = await storage.bucket(bucketName).getFiles({ prefix: folder});

        // we want one directory for store thumbnails locally so if directory not exist then create one
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        files.map(async (vid) => {
            let videoUrl = vid.metadata.mediaLink;
            // download video > create thumbnail of that video > upload the thumbnails to GCS > then delete the created thumbnails from local
            await StoreAndUpload(videoUrl, time_marks);
        });

        return res.status(200).json({
            msg: "success",
        });
    } catch (err) {
        console.log('err : ', err);
        return res.status(400).json({
            msg: "err",
            err: err,
        })
    }
};

/**
 * @method POST
 * @route "/uploadVideo"
 * @description This method will download video locally and then will upload video to the google cloud storage and at last it will delete downloaded video.
 * @param, video_url (body)
 * @returns This will return success message while other processes like download and upload video to the google cloud storage will be run in background.
 */
const uploadVideo = async (req, res) => {
    try {
        let { video_url } = req.body;

        // request package is used for download video
        request.get(video_url)

        // handle error if any occur while downloading the video
        .on('error', (err) => {
            console.log("err in download video from req.get :: ", err);
        })  

        // createWriteStream will download video as Temp.mp4 in main directory
        .pipe(fs.createWriteStream("Temp.mp4"))

        // after successfully download the video we will upload it to the google cloud storage
        .on('finish', async () => {         
            // create instance of storage with our credentials
            const storage = new Storage({
                keyFilename: serviceKey,
                projectId: process.env.PROJECT_ID,
            });    
    
            const bucketName = process.env.BUCKET_NAME;

            // create a unique file name with 6 digin random number and current date
            const fileName = `${Math.random().toString().substr(2, 6)}--${new Date().toISOString()}--video.mp4`;

            // getting bucket
            const bucket = storage.bucket(bucketName);

            // uploading video to the bucket
            let uploadedVideo = await bucket.upload("Temp.mp4", {
                destination: path.join(process.env.BUCKET_VIDEO_FOLDER, fileName),
                contentType: 'video/mp4'
            });
            console.log("uploadedVideo :: ", uploadedVideo[0].metadata.selfLink);

            // removing video which is stored in our main directory named "Temp.mp4"
            await fse.remove(path.resolve(__dirname,'../Temp.mp4'));
        });
        
        return res.status(200).json({
            msg: "success",
        });
    } catch (err) {
        console.log('err : ', err);
        return res.status(400).json({
            msg: "err",
            err: err,
        })
    }
}

module.exports = {
    CreateImageThumbnail,
    SyncCatalog,
    CreateThumbnailOfAllBucketVideoes,
    uploadVideo,
}
const fs = require("fs");
const dir = './Thumbnails';
const fse = require("fs-extra");
const request = require("request");
const { RecombeeSync } = require("../utils/RecombeeSync");
const { StoreAndUpload } = require("../utils/StoreVideoAndCreateThumbnail");
const { Storage } = require('@google-cloud/storage');
const path = require("path");
const serviceKey = path.join(__dirname, '../utils/sacred-sound-2a7ce18e134a.json');
  
const CreateImageThumbnail = async function(req, res) {
    try {
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

        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        // store video locally and create thumbnails and store new thumbnails to the GCS
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

const SyncCatalog = async function (req, res) {
    try {
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

const CreateThumbnailOfAllBucketVideoes = async (req, res) => {
    try {
        const { time_marks = ["1"] } = req.body;
        const storage = new Storage({
            keyFilename: serviceKey,
            projectId: process.env.PROJECT_ID,
        });    
        const bucketName = process.env.BUCKET_NAME;
        const folder = process.env.BUCKET_VIDEO_FOLDER;

        const [files] = await storage.bucket(bucketName).getFiles({ prefix: folder});

        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        files.map(async (vid) => {
            let videoUrl = vid.metadata.selfLink;
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

const uploadVideo = async (req, res) => {
    try {
        let { video_url } = req.body;

        request.get(video_url)
        .on('error', (err) => {
            console.log("err in download video from req.get :: ", err);
        })
        .pipe(fs.createWriteStream("Temp.mp4"))
        .on('finish', async () => {         
            const storage = new Storage({
                keyFilename: serviceKey,
                projectId: process.env.PROJECT_ID,
            });    
    
            const bucketName = process.env.BUCKET_NAME;
            const fileName = `${Math.random().toString().substr(2, 6)}--${new Date().toISOString()}--video.mp4`;
            const bucket = storage.bucket(bucketName);
            let uploadedVideo = await bucket.upload("Temp.mp4", {
                destination: path.join(process.env.BUCKET_VIDEO_FOLDER, fileName),
                contentType: 'video/mp4'
            });
            console.log("uploadedVideo :: ", uploadedVideo[0].metadata.selfLink);
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
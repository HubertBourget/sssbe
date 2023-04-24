const path = require("path");
const ffmpeg = require('fluent-ffmpeg');
const fs = require("fs");
const fse = require("fs-extra");
const request = require("request");
const Video = require("../models/Video");
const User = require("../models/User");
const { upload } = require("../utils/uploadToS3");
const dir = './Thumbnails';
const directoryPath = path.resolve(__dirname,'../Thumbnails');
const { RecombeeSync } = require("../utils/RecombeeSync");

async function getFilePaths() {
    try {
        const files = await fs.promises.readdir(directoryPath);
        return files.map((file) => path.join(directoryPath, file));
    } catch (err) {
        console.log('Error getting directory information:', err);
        return [];
    }
}  
  
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

        request.get(video_url)
        .on('error', (err) => {
            console.log("err in download video from req.get :: ", err);
            return res.status(400).json({
                err: true,
                error: err
            });
        })
        .pipe(fs.createWriteStream("Temp.mp4"))
        .on('finish', () => {         
            const videoFilePath = path.resolve(__dirname, '../Temp.mp4');
            let fileName = "image"

            ffmpeg(videoFilePath)
            .on('end', (err, files) => {                
                getFilePaths().then(async (data) => {
                    await upload(data);
                    fse.emptyDir(path.resolve(__dirname,'../Thumbnails'));
                    await fse.remove(path.resolve(__dirname,'../Temp.mp4'));
                }).catch((e) => {
                    console.log("e :: ", e);
                });
            })
            .on('error', (err) => {
                console.log('Error:', err.message);
            })
            .screenshots({
                count: 1,
                timemarks: time_marks,
                filename: fileName+ ".jpg",
                folder: path.resolve(__dirname,'../Thumbnails'),
                fastSeek: true
            });
        });

        return res.status(200).json({
            msg: "success"
        })
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
}

module.exports = {
    CreateImageThumbnail,
    SyncCatalog,
}
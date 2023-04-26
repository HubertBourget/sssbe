const fs = require("fs");
const path = require("path");
const fse = require("fs-extra");
const request = require("request");
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
const { getFilePaths } = require("./getAllFiles");
const directoryPath = path.resolve(__dirname,'../Thumbnails');
const { upload } = require("./uploadToS3");


const StoreAndUpload = async function (video_url, time_marks) {
    try {
        // store video locally
        request.get(video_url)
        .on('error', (err) => {
            console.log("err in download video from req.get :: ", err);
        })
        .pipe(fs.createWriteStream("Temp.mp4"))
        .on('finish', () => {         
            const videoFilePath = path.resolve(__dirname, '../Temp.mp4');
            let fileName = "image"

            ffmpeg(videoFilePath)
            .on('end', (err, files) => {                
                getFilePaths(directoryPath).then(async (data) => {
                    console.log("images to being upload :: ", data);
                    await upload(data);
                    fse.emptyDir(path.resolve(__dirname,'../Thumbnails'));
                    await fse.remove(path.resolve(__dirname,'../Temp.mp4'));
                }).catch((e) => {
                    console.log("err in getFilePaths :: ", e);
                });
            })
            .on('error', (err) => {
                console.log("err in get video by ffmpeg :: ", err);
            })
            .screenshots({
                count: 1,
                timemarks: time_marks,
                filename: fileName+ ".jpg",
                folder: path.resolve(__dirname,'../Thumbnails'),
                fastSeek: true
            });
        });
    } catch (err) {
        console.log('err : ', err);
    }
}

module.exports = {
    StoreAndUpload,
}
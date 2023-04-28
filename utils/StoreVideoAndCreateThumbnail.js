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

/**
 * @description This method will take video_url and time_marks(on which second of video we want to create a thumbnail) as an arguments and then first of all it will download the video locally by using the request package. then it will create a thumbnail and will store that thumbnail to the google cloud storage. and at last also will delete the video which downloaded locally.
 * @param, time_marks, video_url (body)
 * @returns This will not return anything, it will just do all the process in background.
 */
const StoreAndUpload = async function (video_url, time_marks) {
    try {
        // request package is used for download video
        request.get(video_url)

        // handle error if any occur while downloading the video
        .on('error', (err) => {
            console.log("Err in File-StoreVideoAndCreateThumbnail > Method-StoreAndUpload > download video from req.get :: ", err);
        })

        // createWriteStream will download video as Temp.mp4 in main directory
        .pipe(fs.createWriteStream("Temp.mp4"))

        // after successfully download the video we will upload it to the google cloud storage
        .on('finish', () => {         
            const videoFilePath = path.resolve(__dirname, '../Temp.mp4');
            let fileName = "image"

            // read video
            ffmpeg(videoFilePath)

            .on('end', (err, files) => {                
                // get paths of all the files contains in "directoryPath"
                getFilePaths(directoryPath).then(async (data) => {

                    // upload images to the google cloud storage
                    await upload(data);

                    // delete all the thumbnails which are generated and stored in directoryPath
                    fse.emptyDir(path.resolve(__dirname,'../Thumbnails'));

                    // delete Temp.mp4 video which we have downloaded locally
                    await fse.remove(videoFilePath);
                }).catch((e) => {
                    console.log("Err in File-StoreVideoAndCreateThumbnail > Method-StoreAndUpload > getFilePaths :: ", e);
                });
            })

            // handle error if any occur while downloading the video
            .on('error', (err) => {
                console.log("Err in File-StoreVideoAndCreateThumbnail > Method-StoreAndUpload > get video by ffmpeg :: ", err);
            })

            // creates thumbnails
            .screenshots({
                count: 1,
                timemarks: time_marks,
                filename: fileName+ ".jpg",
                folder: directoryPath,
                fastSeek: true
            });
        });
    } catch (err) {
        console.log('Err in File-StoreVideoAndCreateThumbnail > Method-StoreAndUpload > : ', err);
    }
}

module.exports = {
    StoreAndUpload,
}
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
            })
        }

        // we want one directory for store thumbnails locally so if directory not exist then create one
        if (!fs.existsSync(thumbnailDir)){
            fs.mkdirSync(thumbnailDir);
        }

        // store video locally then create thumbnails and then store new thumbnails to the GCS
        await StoreAndUpload(video_url, time_marks);

        return res.status(200).json({
            msg: "success"
        });
    } catch (err) {
        console.log('Err in File-ThumbnailController > Method-CreateImageThumbnail > : ', err);
        return res.status(400).json({
            err: true,
            error: err,
        });
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

        // getting bucket name and folder name in which our video will be store
        const folder = process.env.BUCKET_VIDEO_FOLDER;

        // getting all the media links of videoes which are stored in specific folder in bucket
        const [files] = await bucket.getFiles({ prefix: folder});

        // we want one directory for store thumbnails locally so if directory not exist then create one
        if (!fs.existsSync(thumbnailDir)){
            fs.mkdirSync(thumbnailDir);
        }

        res.status(200).json({
            msg: "success",
        });

        for (let i = 0; i < files.length; i++) {
            let videoUrl = files[i].metadata.mediaLink;
            // download video > create thumbnail of that video > upload the thumbnails to GCS > then delete the created thumbnails from local
            await StoreAndUpload(videoUrl, time_marks);
        }
    } catch (err) {
        console.log('Err in File-ThumbnailController > Method-CreateThumbnailOfAllBucketVideoes > : ', err);
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
const UploadVideo = async (req, res) => {
    try {
        let { video_url } = req.body;

        if (!video_url && !req.file) {
            return res.status(400).json({
                err: true,
                error: "Please provide video!!",
            })
        }

        if (req.file) {
            // create a unique file name with 6 digin random number and current date
            const fileName = `${Math.random().toString().substr(2, 6)}--${new Date().toISOString()}--video.mp4`;

            // uploading video to the bucket
            let data = await bucket.upload(req.file.path, {
                destination: path.join(process.env.BUCKET_VIDEO_FOLDER, fileName),
                contentType: 'video/mp4'
            });

            // removing video which is stored in our main directory named "Temp.mp4"
            fse.emptyDir(path.resolve(__dirname,'../Uploads'));

            return res.status(200).json({
                msg: "success",
                data: {
                    video_url: data[0].metadata.mediaLink
                },
            });
        } else {
            // request package is used for download video
            request.get(video_url)
    
            // handle error if any occur while downloading the video
            .on('error', (err) => {
                console.log("Err in File-ThumbnailController > Method-CreateThumbnailOfAllBucketVideoes > download video from req.get :: ", err);
            })  
    
            // createWriteStream will download video as Temp.mp4 in main directory
            .pipe(fs.createWriteStream("Temp.mp4"))
    
            // after successfully download the video we will upload it to the google cloud storage
            .on('finish', async () => {         
        
                // create a unique file name with 6 digin random number and current date
                const fileName = `${Math.random().toString().substr(2, 6)}--${new Date().toISOString()}--video.mp4`;
    
                // uploading video to the bucket
                const data = await bucket.upload("Temp.mp4", {
                    destination: path.join(process.env.BUCKET_VIDEO_FOLDER, fileName),
                    contentType: 'video/mp4'
                });
    
                // removing video which is stored in our main directory named "Temp.mp4"
                await fse.remove(path.resolve(__dirname,'../Temp.mp4'));

                return res.status(200).json({
                    msg: "success",
                    data: {
                        video_url: data[0].metadata.mediaLink
                    },
                })
            });
        }
    } catch (err) {
        console.log('Err in File-ThumbnailController > Method-uploadVideo > : ', err);
        return res.status(400).json({
            msg: "err",
            err: err,
        })
    }
};

module.exports = {
    CreateImageThumbnail,
    CreateThumbnailOfAllBucketVideoes,
    UploadVideo,
}
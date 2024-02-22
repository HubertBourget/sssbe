// const path = require("path");
// const fs = require("fs");
// const fse = require("fs-extra");
// const request = require("request");
// const { upload } = require("../utils/uploadToBucket");
// const { url } = require("inspector");
// const dir = './Thumbnails';
// const directoryPath = path.resolve(__dirname,'../Thumbnails');
// const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
// const ffmpeg = require('fluent-ffmpeg');
// ffmpeg.setFfmpegPath(ffmpegPath);

// async function getFilePaths() {
//     try {
        
//         const files = await fs.promises.readdir(directoryPath);
//         return files.map((file) => path.join(directoryPath, file));
//     } catch (err) {a
//         console.log('Error getting directory information:', err);
//         return [];
//     }
// } 

// const CreateImageThumbnail = async function(req, res) {
//     try {
//         const { 
//             video_url, 
//             video_id,
//             email,
//             time_marks = ["0", "5", "10"],
//         } = req.body;

//         if (!video_url) {
//             return res.status(400).json({
//                 err: true,
//                 error: "Please provide the video url!",
//             })
//         }
//         if(!video_id) {
//             return res.status(400).json({
//                 err: true,
//                 error: "Please provide the video id!",
//             })
//         }

//         if (!fs.existsSync(dir)){
//             fs.mkdirSync(dir);
//         }
//         let destination = process.env.BUCKET_FOLDER;


//         request.get(video_url)
//         .on('error', (err) => {
//             console.log("err in download video from req.get :: ", err);
//             return res.status(400).json({
//                 err: true,
//                 error: err
//             });
//         })
//         .pipe(fs.createWriteStream("Temp.mp4"))
//         .on('finish', () => {         
//             const videoFilePath = path.resolve(__dirname, '../Temp.mp4');
//             let fileName = "image"

//             ffmpeg(videoFilePath)
//             .on('end', (err, files) => {                
//                 try {
//                     getFilePaths().then(async (data) => {
//                         await upload(data, video_id, email);
//                         fse.emptyDir(path.resolve(__dirname,'../Thumbnails'))
//                     }).catch((e) => {
//                         console.log("e :: ", e);
//                     });
//                 } catch (err) {
//                     console.log('Error generating thumbnail:', err);
//                 }
//             })
//             .on('error', (err) => {
//                 console.log('Error:', err.message);
//             })
//             .screenshots({
//                 count: 1,
//                 timemarks: time_marks,
//                 filename: fileName+ ".jpg",
//                 folder: path.resolve(__dirname,'../Thumbnails'),
//                 fastSeek: true
//             });
//         });
        


//         return res.status(200).json({
//             msg: "success"
//         })
//     } catch (err) {
//         console.log("Error generating thumbnail:", err);
//         return res.status(400).json({
//             err: true,
//             error: err,
//         });
//     }
// };

// module.exports = {
//     CreateImageThumbnail,
// }
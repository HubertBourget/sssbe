const path = require("path");

const storage = require('../utils/googleCloudStorage');
const { bucket } = require('../utils/googleCloudStorage');


module.exports = {
    /**
     * @description This method will upload the Image to google cloud storage
     * @param, Array of string as a "url" parameter
     * @returns This will return the media url of images which are uploaded to the google cloud storage.
     */
    upload: async function (url) {
        try { 

            const folder = process.env.BUCKET_THUMBNAIL_FOLDER;

            // create a unique file name with 6 digin random number and current date
            const fileName = `${Math.random().toString().substr(2, 6)}--${new Date().toISOString()}--image.jpg`;

            let imgUrls = [];
            for (let i = 0; i < url.length; i++) {
                
                // uploading images to the bucket
                let data = await bucket.upload(url[i], {
                    destination: path.join(folder, fileName),
                });

                imgUrls.push(data[0].metadata.mediaLink);
            }

            return imgUrls;
        } catch(err) {
            console.log("Err in File-uploadToS3 > Method-upload > :: ", err);
        }
    },
}
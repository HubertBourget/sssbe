const { Storage } = require('@google-cloud/storage');
const path = require("path");
const serviceKey = path.join(__dirname, './sacred-sound-2a7ce18e134a.json');

module.exports = {
    /**
     * @description This method will upload the Image to google cloud storage
     * @param, Array of string as a "url" parameter
     * @returns This will return the media url of images which are uploaded to the google cloud storage.
     */
    upload: async function (url) {
        try {
            // create instance of storage with our credentials
            const storage = new Storage({
                keyFilename: serviceKey,
                projectId: process.env.PROJECT_ID,
            });    

            const bucketName = process.env.BUCKET_NAME;
            const folder = process.env.BUCKET_THUMBNAIL_FOLDER;

            // create a unique file name with 6 digin random number and current date
            const fileName = `${Math.random().toString().substr(2, 6)}--${new Date().toISOString()}--image.jpg`;

            let imgUrls = [];
            for (let i = 0; i < url.length; i++) {
                
                // uploading images to the bucket
                let data = await storage.bucket(bucketName).upload(url[i], {
                    destination: path.join(folder, fileName),
                });

                imgUrls.push(data[0].metadata.selfLink);
            }

            console.log("uploaded imgUrls :: ", imgUrls);
            return imgUrls;
        } catch(err) {
            console.log("err in file upload in gcs :: ", err);
        }
    },
}

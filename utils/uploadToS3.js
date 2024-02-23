const path = require("path");
const { bucket } = require('../utils/googleCloudStorage');

module.exports = {
    /**
     * @description This method will upload the Image to google cloud storage
     * @param, Array of string as a "url" parameter
     * @returns This will return the media url of images which are uploaded to the google cloud storage.
     */
    upload: async function (urls) {
        try {
            const folder = process.env.BUCKET_THUMBNAIL_FOLDER;
            console.log("Uploading images to folder:", folder);

            let imgUrls = [];
            for (let i = 0; i < urls.length; i++) {
                console.log(`Uploading image ${i+1}/${urls.length}: ${urls[i]}`);
                // Generate a unique fileName for each image to avoid overwriting
                const fileName = `${Math.random().toString().substr(2, 6)}--${new Date().toISOString()}--image.jpg`;
                console.log(`Generated fileName: ${fileName}`);
                
                let data = await bucket.upload(urls[i], {
                    destination: path.join(folder, fileName),
                });

                console.log(`Image ${i+1} uploaded. Media link:`, data[0].metadata.mediaLink);
                imgUrls.push(data[0].metadata.mediaLink);
            }


            console.log("All images uploaded successfully");
            return imgUrls;
        } catch(err) {
            console.error("Error in upload function:", err);
            throw err; // rethrow the error after logging
        }
    },
};

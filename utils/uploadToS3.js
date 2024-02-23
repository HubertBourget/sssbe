const path = require("path");
const { bucket } = require('../utils/googleCloudStorage');

module.exports = {
    upload: async function (urls) {
        try {
            const folder = process.env.BUCKET_THUMBNAIL_FOLDER;
            console.log("Uploading images to folder:", folder);

            let imgUrls = [];
            for (let i = 0; i < urls.length; i++) {
                console.log(`Uploading image ${i+1}/${urls.length}: ${urls[i]}`);
                const fileName = `${Math.random().toString().substr(2, 6)}--${new Date().toISOString()}--image.jpg`;
                console.log(`Generated fileName: ${fileName}`);
                
                try {
                    let data = await bucket.upload(urls[i], {
                        destination: path.join(folder, fileName),
                    });
                    console.log(`Image ${i+1} uploaded. Media link:`, data[0].metadata.mediaLink);
                    imgUrls.push(data[0].metadata.mediaLink);
                } catch (uploadError) {
                    console.error(`Error uploading image ${i+1}:`, uploadError);
                    throw uploadError; // Throw to be caught by the outer catch
                }
            }

            console.log("All images uploaded successfully");
            return imgUrls;
        } catch(err) {
            console.error("Error in upload function:", err);
            return { err: true, error: err.message || "An error occurred during upload." };
        }
    },
};

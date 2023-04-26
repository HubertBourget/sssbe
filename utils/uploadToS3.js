const { Storage } = require('@google-cloud/storage');
const path = require("path");
const serviceKey = path.join(__dirname, './sacred-sound-2a7ce18e134a.json');

module.exports = {
    upload: async function (url) {
        try {
            const storage = new Storage({
                keyFilename: serviceKey,
                projectId: process.env.PROJECT_ID,
            });    
            const bucketName = process.env.BUCKET_NAME;
            const folder = process.env.BUCKET_THUMBNAIL_FOLDER;
            const fileName = `${Math.random().toString().substr(2, 6)}--${new Date().toISOString()}--image.jpg`;

            let imgUrls = [];
            for (let i = 0; i < url.length; i++) {
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

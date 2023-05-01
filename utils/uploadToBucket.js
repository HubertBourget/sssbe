const { Storage } = require('@google-cloud/storage');
const path = require("path");
const { MongoClient } = require("mongodb");
const { MONGO_URI } = process.env;
const serviceKey = path.join(__dirname, './sacred-sound-2a7ce18e134a.json')

const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};

module.exports = {
    upload: async function (url, video_id) {
        let imgUrls = [];
        try {
        const storage = new Storage({
            keyFilename: serviceKey,
            projectId: process.env.PROJECT_ID,
        });
        const bucketName = process.env.BUCKET_NAME;
        const folder = process.env.BUCKET_FOLDER;
        const fileName = `${Math.random().toString().substr(2, 6)}--${new Date().toISOString()}--image.jpg`;

        
        for (let i = 0; i < url.length; i++) {
            let data = await storage.bucket(bucketName).upload(url[i], {
            destination: `${folder}/${fileName}`,
            });

            const [metadata] = await data[0].getMetadata();
            const publicUrl = await storage.bucket(bucketName).file(`${folder}/${fileName}`).getSignedUrl({
            action: 'read',
            expires: '03-17-2035',
            });
            imgUrls.push(publicUrl[0]);
        }

        //uploading ImageURL to MongoDB VideoMetaData document
        const client = await MongoClient.connect(MONGO_URI, options);
    try {
        const db = client.db("db-name");
        const collection = db.collection("VideoMetaData");

        const query = { "VideoMetaData.videoId": video_id };
        const update = {
            $set: {
                "VideoMetaData.ImageThumbnailURL" : imgUrls[0]
            },
        };
        const options = { returnOriginal: false };

        const result = await collection.findOneAndUpdate(query, update, options);

        if (!result.value) {
            console.log("404")
            // return res.status(404).json({ error: "No document found with that videoId" });
        }
        // return res.status(200).json({ status: 200, result: result.value });
    } catch (error) {
        console.error(error);
        // return res.status(500).json({ error: error.message });
    } finally {
        client.close();
    }

        console.log("imgUrls :: ", imgUrls);
        return imgUrls;
        } catch (err) {
        console.log("err in file upload in gcs :: ", err);
        }
    },
};
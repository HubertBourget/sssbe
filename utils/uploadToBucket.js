const { Storage } = require('@google-cloud/storage');
const path = require("path");
const { MongoClient } = require("mongodb");
const { MONGO_URI } = process.env;

const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};

module.exports = {
    upload: async function (url, video_id, email) {
        let imgUrls = [];
        try {
            // Fetch the decrypted key from the endpoint
            const { data: decryptedKey } = await axios.post("/api/decodeCreds");
            
            const storage = new Storage({
                credentials: JSON.parse(decryptedKey),
                projectId: process.env.PROJECT_ID,
            });
        const bucketName = process.env.BUCKET_NAME;
        const folder = process.env.BUCKET_THUMBNAIL_FOLDER;

        
        for (let i = 0; i < url.length; i++) {
            const fileName = `${Math.random().toString().substr(2, 6)}--${new Date().toISOString()}--image.jpg`;
            let data = await storage.bucket(bucketName).upload(url[i], {
            destination: `${folder}/${email}/${fileName}`,
            });
            // const [metadata] = await data[0].getMetadata(); //unused line of code, commented out.
            const publicUrl = await storage.bucket(bucketName).file(`${folder}/${email}/${fileName}`).getSignedUrl({
            action: 'read',
            expires: '11-11-2099',
            });
            imgUrls.push(publicUrl[0]);
        }

        //uploading ImageURL to MongoDB ContentMetaData document
        const client = await MongoClient.connect(MONGO_URI, options);
    try {
        const db = client.db("db-name");
        const collection = db.collection("ContentMetaData");

        const query = { videoId: video_id };
        const update = {
            $set: {
                ImageThumbnailURL0: imgUrls[0],
                ImageThumbnailURL1: imgUrls[1],
                ImageThumbnailURL2: imgUrls[2]
            },
        };
        const options = { returnOriginal: false };

        const result = await collection.findOneAndUpdate(query, update, options);

        if (!result.value) {
            console.log("404")
            // return res.status(404).json({ error: "No document found with that videoId" });
        }
        return result;
        // return res.status(200).json({ status: 200, result: result.value });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: error.message });
        } finally {
            client.close();
        }} 
        catch (err) {
        console.log("err in file upload in gcs :: ", err);
        // return res.status(500).json({ error: error.message });
        }
    },
};

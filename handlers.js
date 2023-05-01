
const { MongoClient } = require("mongodb");
require("dotenv").config();
const { MONGO_URI } = process.env;

const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};

const getServerHomePage = async (req, res) => {
    res.status(200).json({status: 200, message:`Sacred Sound Studio Back End Server is currently up and running!`});
};

const postVideoMetaData = async (req, res) => {
    const VideoMetaData = {
        VideoMetaData: req.body
    }

    const client = await new MongoClient(MONGO_URI, options);
    try{
        client.connect();
        console.log("connected!");
        const db = client.db('db-name');
        const result = await db.collection("VideoMetaData").insertOne(VideoMetaData);
        res.status(200).json({ status: 200, result: result })
        client.close();
        console.log("disconnected!");
    }
    catch (e){
        res.status(400).json({ status: 400, message: e.message })
    }
}

const getPreReviewedVideoList = async (req, res) => {
    const client = await new MongoClient(MONGO_URI, options);
    try {
        await client.connect();
        const collection = client.db('db-name').collection('VideoMetaData');
        const videos = await collection.find({
            "VideoMetaData.videoOwner": req.query.videoOwner,
            "VideoMetaData.b_isPreparedForReview": false
        }).toArray();
        res.json(videos);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    } finally {
        await client.close();
    }
};

const updateVideoMetaData = async (req, res) => {
    const { videoId, title, description, category } = req.body;

    if (!videoId) {
        return res.status(400).json({ error: "Missing videoId parameter" });
    }

    const client = await MongoClient.connect(MONGO_URI, options);
    try {
        const db = client.db("db-name");
        const collection = db.collection("VideoMetaData");

        const query = { "VideoMetaData.videoId": videoId };
        const update = {
            $set: {
                "VideoMetaData.b_isPreparedForReview": true,
                "VideoMetaData.title": title,
                "VideoMetaData.description": description,
                "VideoMetaData.category": category,
            },
        };
        const options = { returnOriginal: false };

        const result = await collection.findOneAndUpdate(query, update, options);

        if (!result.value) {
            return res.status(404).json({ error: "No document found with that videoId" });
        }

        return res.status(200).json({ status: 200, result: result.value });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    } finally {
        client.close();
    }
};

const updateUserProfile = async (req, res) => {
    const { bio, artistLink, email } = req.body;

    const client = await MongoClient.connect(MONGO_URI, options);
    try {
        const db = client.db("db-name");
        const collection = db.collection("users");

        const query = { "email": email };
        const update = {
            $set: {
                bio,
                artistLink,
            },
        };
        const options = { returnOriginal: false };

        const result = await collection.findOneAndUpdate(query, update, options);

        if (!result.value) {
            return res.status(404).json({ error: "No document found with that email" });
        }

        return res.status(200).json({ status: 200, result: result.value });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    } finally {
        client.close();
    }
};

const getUserProfile = async (req, res) => {
    const client = await new MongoClient(MONGO_URI, options);
    try {
        const db = client.db("db-name");
        const collection = db.collection('users');
        const user = await collection.findOne({ email: req.params.userId });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { bio, artistLink, profileImageUrl } = user;

        return res.status(200).json({ bio, artistLink, profileImageUrl });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    } finally {
        await client.close();
    }
};

const b_getUserExist = async (req, res) => {
    const client = await new MongoClient(MONGO_URI, options);
    try {
        const db = client.db("db-name");
        const collection = db.collection('userAccounts');
        const user = await collection.findOne({ "user.email": req.params.userId });
        
        if (!user) {
            return res.status(404).json({ exist: false, message: 'User not found' });
        }

        return res.status(200).json({ exist: true, message: 'User found', user: user });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    } finally {
        await client.close();
    }
};

const getVideoUrlById = async (req, res) => {
    const client = await new MongoClient(MONGO_URI, options);
    try {
        const db = client.db("db-name");
        const collection = db.collection('VideoMetaData');
        const videoDocument = await collection.findOne({ "VideoMetaData.videoId": req.query.videoId });
        if (!videoDocument) {
            return res.status(404).json({ message: 'videoDocument not found: err.404' });
        }
        const fileUrl = videoDocument.VideoMetaData.fileUrl;
        return res.status(200).json({ fileUrl });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    } finally {
        await client.close();
    }
};


const postProfileImage = async (req, res) => {
const { profileImageUrl, email } = req.body; 

    const client = await MongoClient.connect(MONGO_URI, options);
    try {
        const db = client.db("db-name");
        const collection = db.collection("users");

        const query = { "email": email };
        const update = {
            $set: {
                profileImageUrl,
            },
        };
        const options = { returnOriginal: false };

        const result = await collection.findOneAndUpdate(query, update, options);

        if (!result.value) {
            return res.status(404).json({ error: "No document found with that email" });
        }

        return res.status(200).json({ status: 200, result: result.value });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    } finally {
        client.close();
    }
}

const checkAccountName = async (req, res) => {
    const { username } = req.params;
    const client = await new MongoClient(MONGO_URI, options);
    try {
        const db = client.db("db-name");
        const collection = db.collection('users');

        if (username.length < 3) {
            return res.status(200).json({ taken: true, message: 'Account name already exists' });
        }

        const existingUser = await collection.findOne({ username });

        if (existingUser) {
            return res.status(200).json({ taken: true, message: 'Account name already exists' });
        }

        return res.status(200).json({ taken: false, message: 'Account name is available' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    } finally {
        await client.close();
    }
};

const postNewUserWithAccountName = async (req, res) => {
    const { email, username, isArtist } = req.body;
    const user = {
        email,
        username,
        isArtist
    };

    const client = await new MongoClient(MONGO_URI, options);
    try{
        client.connect();
        console.log("connected!");
        const db = client.db('db-name');
        console.log(user);
        const result = await db.collection("userAccounts").insertOne(user);
        res.status(200).json({ status: 200, result: result })
        client.close();
        console.log("disconnected!");
    }
    catch (e){
        res.status(400).json({ status: 400, message: e.message })
    }
}







module.exports = {
    getServerHomePage,
    postVideoMetaData,
    getPreReviewedVideoList,
    updateVideoMetaData,
    updateUserProfile,
    getUserProfile,
    postProfileImage,
    checkAccountName,
    getVideoUrlById,
    b_getUserExist,
    postNewUserWithAccountName,
};
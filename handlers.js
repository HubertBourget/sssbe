
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

// Reviewed Mai 1st
const postContentMetaData = async (req, res) => {
    const { videoOwner, videoId, timestamp,  fileUrl, isOnlyAudio, b_isPreparedForReview, b_hasBeenReviewed, b_isApproved } = req.body;
    const ContentMetaData = {
        videoOwner,
        videoId,
        timestamp,
        fileUrl,
        isOnlyAudio,
        b_isPreparedForReview: b_isPreparedForReview,
        b_hasBeenReviewed: b_hasBeenReviewed,
        b_isApproved: b_isApproved,
    };

    const client = await new MongoClient(MONGO_URI, options);
    try{
        client.connect();
        const db = client.db('db-name');
        const result = await db.collection("ContentMetaData").insertOne(ContentMetaData);
        res.status(200).json({ status: 200, result: result })
        client.close();
    }
    catch (e){
        res.status(400).json({ status: 400, message: e.message })
    }
}

// Reviewed Mai 1st
const getPreReviewedVideoList = async (req, res) => {
    const client = await new MongoClient(MONGO_URI, options);
    try {
        await client.connect();
        const collection = client.db('db-name').collection('ContentMetaData');
        const videos = await collection.find({
            videoOwner: req.query.videoOwner,
            b_isPreparedForReview: false
        }).toArray();
        res.json(videos);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    } finally {
        await client.close();
    }
};

// Reviewed Mai 1st
const updateContentMetaData = async (req, res) => {
    const { videoId, b_isPreparedForReview, title, description, category, selectedImageThumbnail } = req.body;
    console.log(req.body);
    if (!videoId) {
        return res.status(400).json({ error: "Missing videoId parameter" });
    }

    const client = await MongoClient.connect(MONGO_URI, options);
    try {
        const db = client.db("db-name");
        const collection = db.collection("ContentMetaData");

        const query = { videoId: videoId };
        const update = {
            $set: {
                b_isPreparedForReview: b_isPreparedForReview,
                title: title,
                description: description,
                category: category,
                selectedImageThumbnail: selectedImageThumbnail
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

// Reviewed Mai 1st
const updateUserProfile = async (req, res) => {
    const { bio, artistLink, email } = req.body;

    const client = await MongoClient.connect(MONGO_URI, options);
    try {
        const db = client.db("db-name");
        const collection = db.collection("userAccounts");

        const query = { email: email };
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

// Reviewed Mai 1st
const getUserProfile = async (req, res) => {
    const client = await new MongoClient(MONGO_URI, options);
    try {
        const db = client.db("db-name");
        const collection = db.collection('userAccounts');
        const user = await collection.findOne({ email: req.params.userId });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { accountName, bio, artistLink, profileImageUrl } = user;

        return res.status(200).json({ accountName, bio, artistLink, profileImageUrl });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    } finally {
        await client.close();
    }
};

// Reviewed Mai 1st
const b_getUserExist = async (req, res) => {
    const client = await new MongoClient(MONGO_URI, options);
    try {
        const db = client.db("db-name");
        const collection = db.collection('userAccounts');
        const user = await collection.findOne({ email: req.params.userId });
        
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

// Reviewed Mai 1st
const getContentById = async (req, res) => {
    const client = await new MongoClient(MONGO_URI, options);
    try {
        const db = client.db("db-name");
        const collection = db.collection('ContentMetaData');
        const contentDocument = await collection.findOne({ videoId: req.query.videoId });
        if (!contentDocument) {
            return res.status(404).json({ message: 'contentDocument not found: err.404' });
        }
        return res.status(200).json({ contentDocument });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    } finally {
        await client.close();
    }
};

// Reviewed Mai 1st
const postProfileImage = async (req, res) => {
    const { profileImageUrl, email } = req.body; 
    const client = await MongoClient.connect(MONGO_URI, options);
    try {
        const db = client.db("db-name");
        const collection = db.collection("userAccounts");

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

// Reviewed Mai 1st
const getCheckAccountName = async (req, res) => {
    const { accountName, email } = req.query;
    const client = await new MongoClient(MONGO_URI, options);
    try {
        const db = client.db("db-name");
        const collection = db.collection('userAccounts');

        if (accountName.length < 3) {
            return res.status(200).json({ taken: true, message: 'Account name already exists.' });
        }

        const existingUser = await collection.findOne({ accountName });

        if (existingUser && existingUser.email == email) {
            return res.status(200).json({ taken: false, message: 'This is your current account name.' });
        }
        else if (existingUser) {
            return res.status(200).json({ taken: true, message: 'Account name already exists.' });
        }

        return res.status(200).json({ taken: false, message: 'Account name is available.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    } finally {
        await client.close();
    }
};

// Reviewed Mai 1st
const postNewUserWithAccountName = async (req, res) => {
    const { email, accountName, isArtist, timestamp } = req.body;
    const user = {
        email,
        accountName,
        isArtist,
        timestamp
    };

    const client = await new MongoClient(MONGO_URI, options);
    try{
        client.connect();
        const db = client.db('db-name');
        const result = await db.collection("userAccounts").insertOne(user);
        res.status(200).json({ status: 200, result: result })
        client.close();
    }
    catch (e){
        res.status(400).json({ status: 400, message: e.message })
    }
}

//Created in September 2023
const getContentByArtist = async (req, res) => {
    const client = await new MongoClient(MONGO_URI, options);

    try {
        const { artistId } = req.query;
        if (!artistId) {
        return res.status(400).json({ message: 'Missing artistId parameter' });
        }

        await client.connect();
        console.log('Client connected')
        const collection = client.db('db-name').collection('ContentMetaData');
        const contentDocuments = await collection.find({ videoOwner: artistId }).toArray();
        res.json(contentDocuments);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    } finally {
        client.close();
    }
};



module.exports = {
    getServerHomePage,
    postContentMetaData,
    getPreReviewedVideoList,
    updateContentMetaData,
    updateUserProfile,
    getUserProfile,
    postProfileImage,
    getCheckAccountName,
    getContentById,
    b_getUserExist,
    postNewUserWithAccountName,
    getContentByArtist,
};
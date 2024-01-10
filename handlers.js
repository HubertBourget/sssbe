
const { MongoClient } = require("mongodb");
require("dotenv").config();
const { MONGO_URI } = process.env;
const { SyncRecombee } = require("./utils/SyncRecombee");

const {
  AddUser,
  AddUserProperty,
  SetUserValues,
  RecommendItemsToUser,
  SetItemValues,
} = require("recombee-api-client").requests;

const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};

const getServerHomePage = async (req, res) => {
    res.status(200).json({status: 200, message:`Sacred Sound Studio Back End Server is currently up and running!`});
};

const postNewUserWithAccountName = async (req, res) => {
    const { email, accountName, isArtist, timestamp } = req.body;
    const user = {
        email,
        accountName,
        isArtist,
        timestamp,
    };

    const client = await new MongoClient(MONGO_URI, options);
    try {
        const { recombeeClient } = require("./utils/constants");
        client.connect();
        const db = client.db("db-name");

        // First try-catch block for MongoDB operations
        try {
            // Add the user to Recombee
            const userId = email;
            

            // Continue with MongoDB operations (inserting the user)
            const result = await db.collection("userAccounts").insertOne(user);

            if (result.insertedId) {
                console.log("User added to MongoDB successfully!");
                await recombeeClient.send(new AddUser(userId));
                res.status(200).json({ status: 200, result: result });
            } else {
                console.log("Failed to create user in MongoDB.");
                res.status(400).json({
                    status: 400,
                    message: "Failed to create user in MongoDB.",
                });
            }
        } catch (mongoError) {
            console.error("Error in MongoDB operations:", mongoError.message);
            console.error("Error details:", mongoError);

            // Continue with appropriate response to the client
            res.status(500).json({ status: 500, message: "Internal server error" });
        }

        // Second try-catch block for Recombee operations
        try {
            // Set values for the user properties
            const userId = email;
            const userProperties = {
                accountName: accountName,
                isArtist: isArtist,
                timestamp: timestamp,
            };

            // Create a SetUserValues request with both the user ID and properties
            const setUserValuesRequest = new SetUserValues(userId, userProperties);

            // Send the request to set user values
            await recombeeClient.send(setUserValuesRequest);

            console.log("User properties added to Recombee successfully!");
        } catch (recombeeError) {
            console.error("Error in Recombee operations:", recombeeError.message);
            console.error("Error details:", recombeeError);
            // Log the error, but continue with the function execution
        }
    } catch (mainError) {
        console.error("Error in the main function:", mainError.message);
        // Continue with appropriate response to the client
        res.status(500).json({ status: 500, message: "Internal server error" });
    } finally {
        client.close();
    }
};

const postContentMetaData = async (req, res) => {
    const { owner, videoId, timestamp,  fileUrl, isOnlyAudio, b_isPreparedForReview, b_hasBeenReviewed, b_isApproved, albumId } = req.body;
    const ContentMetaData = {
        owner,
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

const getPreReviewedVideoList = async (req, res) => {
    const client = await new MongoClient(MONGO_URI, options);
    try {
        await client.connect();
        const collection = client.db('db-name').collection('ContentMetaData');
        const videos = await collection.find({
            owner: req.query.owner,
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

const updateContentMetaData = async (req, res) => {
    const { videoId, b_isPreparedForReview, title, description, category, selectedImageThumbnail, tags } = req.body;
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
                selectedImageThumbnail: selectedImageThumbnail,
                tags: tags
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
    const { accountName, bio, artistLink, email } = req.body;

    const client = await MongoClient.connect(MONGO_URI, options);
    try {
        const db = client.db("db-name");
        const collection = db.collection("userAccounts");

        const query = { email: email };
        const update = {
            $set: {
                accountName,
                bio,
                artistLink,
            },
        };
        const options = { returnOriginal: false };

        const result = await collection.findOneAndUpdate(query, update, options);

        if (!result.value) {
            return res.status(404).json({ error: "No document found with that email" });
        }
        else {
            const { recombeeClient } = require("./utils/constants");
            // Set values for the user properties in Recombee
            const userProperties = {
                accountName: accountName,
                bio: bio,
                artistLink: artistLink,
            };

            // Create a SetUserValues request with both the user ID and properties
            const userId = query.email;
            const setUserValuesRequest = new SetUserValues(
                userId,
                userProperties
            );

            // Send the request to set user values
            await recombeeClient.send(setUserValuesRequest);
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

const getContentByArtist = async (req, res) => {
    const client = await new MongoClient(MONGO_URI, options);

    try {
        const { artistId } = req.query;
        if (!artistId) {
        return res.status(400).json({ message: 'Missing artistId parameter' });
        }

        await client.connect();
        const collection = client.db('db-name').collection('ContentMetaData');
        const contentDocuments = await collection.find({ owner: artistId }).toArray();
        res.json(contentDocuments);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    } finally {
        client.close();
    }
};

const getApprovedVideoContent = async (req, res) => {
    const client = await new MongoClient(MONGO_URI, options);

    try {
        await client.connect();
        const collection = client.db('db-name').collection('ContentMetaData');
        
        // Find documents where both isOnlyAudio is false and b_isApproved is true
        const contentDocuments = await collection.find({ isOnlyAudio: false, b_isApproved: true }).toArray();
        console.log(contentDocuments);
        res.json(contentDocuments);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    } finally {
        client.close();
    }
};

const deleteContent = async (req, res) => {
    const client = new MongoClient(MONGO_URI, options);
    try {
        const { recombeeClient } = require("./utils/constants");
        await client.connect();
        const collection = client.db('db-name').collection('ContentMetaData')
        const videoId = req.query.videoId;
        const userId = req.headers['user-id']; // Extract user ID from the custom header

        // Check if the user making the request is the owner of the content
        const contentDocument = await collection.findOne({ videoId, owner: userId });

        if (!contentDocument) {
            return res.status(404).json({ message: 'Video not found or unauthorized' });
        }

        // Delete the document with the specified videoId
        const result = await collection.deleteOne({ videoId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Video not found' });
        }
        else {
          // Set values for the user properties
            const itemProperties = {
                deleted: true,
            };

            // Create a SetUserValues request with both the user ID and properties
            const setItemValuesRequest = new SetItemValues(
                videoId,
                itemProperties
            );

            // Send the request to set user values
            await recombeeClient.send(setItemValuesRequest);
        }

        res.status(200).json({ message: 'Video deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    } finally {
        client.close();
    }
};

const postNewAlbum = async (req, res) => {
const { albumId, owner, timestamp } = req.body;
    const AlbumMetaData = {
        owner,
        timestamp,
        albumId,
        albumName: '',
    };

    const client = await new MongoClient(MONGO_URI, options);
    try{
        client.connect();
        const db = client.db('db-name');
        const result = await db.collection("AlbumMetaData").insertOne(AlbumMetaData);
        res.status(200).json({ status: 200, result: result })
        client.close();
    }
    catch (e){
        res.status(400).json({ status: 400, message: e.message })
    }
}

const postAlbumImage = async (req, res) => {
    const { albumImageUrl, albumId } = req.body; 
    const client = await MongoClient.connect(MONGO_URI, options);
    try {
        const db = client.db("db-name");
        const collection = db.collection("AlbumMetaData");

        const query = { "albumId": albumId };
        const update = {
            $set: {
                albumImageUrl,
            },
        };
        const options = { returnOriginal: false };

        const result = await collection.findOneAndUpdate(query, update, options);

        if (!result.value) {
            return res.status(404).json({ error: "No document found with that albumId" });
        }

        return res.status(200).json({ status: 200, result: result.value });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    } finally {
        client.close();
    }
}

const updateAlbumMetaData = async (req, res) => {
const { albumId, title, description, visibility } = req.body;

    const client = await MongoClient.connect(MONGO_URI, options);
    try {
        const db = client.db("db-name");
        const collection = db.collection("AlbumMetaData");

        const query = { albumId: albumId };
        const update = {
            $set: {
                title: title,
                description: description,
                visibility: visibility,
            },
        };
        const options = { returnOriginal: false };

        const result = await collection.findOneAndUpdate(query, update, options);

        if (!result.value) {
            return res.status(404).json({ error: "No document found with that albumId: ", albumId });
        }

        return res.status(200).json({ status: 200, result: result.value });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    } finally {
        client.close();
    }
}

const updatePartialContentMetaData = async (req, res) => {
    const { videoId, ...updateFields } = req.body;

    if (!videoId) {
        return res.status(400).json({ error: "Missing videoId parameter" });
    }

    const client = await MongoClient.connect(MONGO_URI, options);
    try {
        const db = client.db("db-name");
        const collection = db.collection("ContentMetaData");

        const query = { videoId: videoId };
        const update = { $set: {} };
        let hasValidFields = false;

        for (const [key, value] of Object.entries(updateFields)) {
            if (value !== undefined) {
                update.$set[key] = value;
                hasValidFields = true;
            }
        }

        if (!hasValidFields) {
            return res.status(400).json({ error: "No valid fields to update" });
        }

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

const encodeCreds = async (req, res) => {
    try {
    if (!req.body) {
        return res.status(400).json({
        err: true,
        error: "Invalid request body!!",
        });
    }

    const jsonString = JSON.stringify(req.body);
    const encoded = Buffer.from(jsonString).toString("base64");

    return res.status(200).json({
        msg: "success",
        data: {
        encoded,
        },
    });
    } catch (err) {
    console.log(
        "Err in File-ThumbnailController > Method-EncodeCreds > : ",
        err
    );
    return res.status(400).json({
        msg: "err",
        err: err,
    });
    }
};

const decodeCreds = async (req, res) => {
    try {
        const encodedData = process.env.ENCODED_KEY;

        if (!encodedData) {
        return res.status(400).json({
            err: true,
            error: "Encoded data not found in environment variable!!",
        });
        }

        const decodedJsonString = Buffer.from(encodedData, "base64").toString(
        "utf-8"
        );
        const decodedObject = JSON.parse(decodedJsonString);

        return res.status(200).json({
        msg: "success",
        data: {
            decodedObject,
        },
        });
    } catch (err) {
        console.log(
        "Err in File-ThumbnailController > Method-DecodeCreds > : ",
        err
        );
        return res.status(400).json({
        msg: "err",
        err: err,
        });
    }
}

const syncCatalog = async (req, res) => {
    try {
        // sync our database with the recombee platform
        const syncRecombeeResponse = await SyncRecombee();


        if (syncRecombeeResponse.success) {
        return res.status(200).json({
            data: syncRecombeeResponse
        });
        } else {
        return res.status(400).json({
            msg: "Data syncing failed.",
            error: syncRecombeeResponse.error || "Unknown error",
        });
        }
    } catch (err) {
        console.log("Error in File-RecombeeController > Method-SyncCatalog:", err);
        return res.status(500).json({
        msg: "Internal server error",
        error: err.message || "An error occurred.",
        });
    }
};

const getRecommendations = async (req, res) => {
    const userId = req.params.userId;
    const { recombeeClient } = require("./utils/constants");
    
    try {
        const count = 3;

        console.log("getRecommendations's UserId is: " + userId);

        const getRecommendationsRequest = new RecommendItemsToUser(userId, count, {
            'scenario': 'scenario_1',
            'cascadeCreate': true,
        });

        const response = await recombeeClient.send(getRecommendationsRequest);
        console.log(response);

        return res.json(response);

    } catch (err) {
        console.log("Error in File-RecombeeController > Method-getRecommendations:", err);
        return res.status(500).json({
            msg: "Internal server error",
            error: err.message || "An error occurred.",
        });
    }
};


//Archived for later use:
const addUserPropertyOnRecombee = async (req, res) => {
    // Define the properties to be added (initialize)
            const propertiesToAdd = [
              { name: "bio", type: "string" },
              { name: "artistLink", type: "string" },
            ];

            // Create an array of AddUserProperty requests
            const addUserPropertyRequests = propertiesToAdd.map(
                (property) => new AddUserProperty(property.name, property.type)
            );

            // Send requests to add user properties
            await Promise.all(
                addUserPropertyRequests.map((request) =>
                recombeeClient.send(request)
                )
            );
}

//manual addUser on Recombee
const addUserOnRecombee = async (req, res) => {
    const userId = req.params.userId;
    try{
        const { recombeeClient } = require("./utils/constants");
        await recombeeClient.send(new AddUser(userId));
        res.status(200).json({ status: 200, message: "User added successfuly on Recombee." });
    }catch (e){
        console.error("Error in addUserOnRecombee operations:", e.message);
        console.error("Error details:", e);
        res.status(500).json({ status: 500, message: "Internal server error" });
    }
}

//manual setUser on Recombee
const setUserOnRecombee = async (req, res) => {
    const userId = req.params.userId;
    try{
        const { recombeeClient } = require("./utils/constants");
            const userProperties = {
                accountName: 'accountName',
                artistLink: 'artistLink',
                bio: 'bio',
                isArtist: true,
                timestamp: new Date().toISOString(),
            };

        // Create a SetUserValues request with both the user ID and properties
        const setUserValuesRequest = new SetUserValues(userId, userProperties);

        // Send the request to set user values
        await recombeeClient.send(setUserValuesRequest);
        res.status(200).json({ status: 200, message: "User was set successfuly on Recombee." });
    }catch (e){
        console.error("Error in setUserOnRecombee operations:", e.message);
        console.error("Error details:", e);
        res.status(500).json({ status: 500, message: "Internal server error" });
    }
}

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
    getApprovedVideoContent,
    deleteContent,
    encodeCreds,
    decodeCreds,
    syncCatalog,
    getRecommendations,
    addUserOnRecombee,
    setUserOnRecombee,
    postNewAlbum,
    postAlbumImage,
    updateAlbumMetaData,
    updatePartialContentMetaData,
};
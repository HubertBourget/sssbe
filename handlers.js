
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const { MONGO_URI } = process.env;
const { SyncRecombee } = require("./utils/SyncRecombee");
const storage = require('./utils/googleCloudStorage');
const { Video } = require('@mux/mux-node');
const { timeStamp } = require("console");
const mux = new Video(process.env.MUX_ACCESS_TOKEN, process.env.MUX_SECRET_KEY);

const { 
    AddUser,
    AddUserProperty,
    SetUserValues,
    RecommendItemsToUser,
    RecommendItemsToItem,
    SetItemValues,
    SearchItems,
    GetItemValues,
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
    const contentType = "userAccounts";
    const user = {
        email,
        accountName,
        isArtist,
        timestamp,
        contentType: contentType,
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
    const { owner, videoId, timestamp,  fileUrl, b_isPreparedForReview, b_hasBeenReviewed, b_isApproved, isOnlyAudio, visibility, category } = req.body;
    const ContentMetaData = {
        owner,
        videoId,
        timestamp,
        fileUrl,
        isOnlyAudio,
        b_isPreparedForReview: b_isPreparedForReview,
        b_hasBeenReviewed: b_hasBeenReviewed,
        b_isApproved: b_isApproved,
        visibility: visibility,
        category: category,
        contentType: 'ContentMetaData',
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
    const { videoId, b_isPreparedForReview, title, description, category, tags } = req.body;

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
                tags: tags,
            }
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
    const { accountName, bio, artistLink, email, artistTitle } = req.body;

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
                artistTitle,
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
    // Check if userId is undefined or not provided, and return a default object
    if (!req.params.userId || req.params.userId === 'undefined') {
        console.log("getUserProfile called with undefined userId");

        // Return a default response with empty strings for user properties
        return res.status(200).json({
            accountName: '',
            bio: '',
            artistLink: '',
            profileImageUrl: '',
            artistTitle: ''
        });
    }

    const client = await new MongoClient(MONGO_URI, options);
    try {
        const db = client.db("db-name");
        const collection = db.collection('userAccounts');
        console.log("getUserProfile:", req.params.userId);
        const user = await collection.findOne({ email: req.params.userId });
        
        if (!user) {
            // If no user is found, return the default object as well
            return res.status(200).json({
                accountName: '',
                bio: '',
                artistLink: '',
                profileImageUrl: '',
                artistTitle: ''
            });
        }

        const { accountName, bio, artistLink, profileImageUrl, artistTitle } = user;

        return res.status(200).json({ accountName, bio, artistLink, profileImageUrl, artistTitle });
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

        // Check if the account name is too short
        if (accountName.length < 3) {
            return res.status(200).json({ taken: true, message: 'Account names need to be at least 3 characters long.' });
        }

        const existingUser = await collection.findOne({ accountName });

        // Check if the account name is taken by the current user
        if (existingUser && existingUser.email === email) {
            return res.status(200).json({ taken: false, message: 'This is your current account name.' });
        }
        // Check if the account name is taken by another user
        else if (existingUser) {
            return res.status(200).json({ taken: true, message: 'Account name already exists.' });
        }

        // The account name is not taken and is of valid length
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
        console.log('fetching getContentByArtist:', artistId)
        await client.connect();
        const collection = client.db('db-name').collection('ContentMetaData');
        const contentDocuments = await collection.find({ owner: artistId }).toArray();
        // console.log('contentDocuments :', contentDocuments)
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
        const collection = client.db('db-name').collection('ContentMetaData');
        const videoId = req.query.videoId;
        const userId = req.headers['user-id']; // Extract user ID from the custom header

        // Check if the user making the request is the owner of the content
        const contentDocument = await collection.findOne({ videoId, owner: userId });

        if (!contentDocument) {
            return res.status(404).json({ message: 'Video not found or unauthorized' });
        }
        try {
            const itemProperties = { deleted: true };
            const recombeeItemId = contentDocument._id.toString();
            console.log('recombeeItemId :', recombeeItemId);
            const setItemValuesRequest = new SetItemValues(recombeeItemId, itemProperties);
            console.log('setItemValuesRequest', setItemValuesRequest);
            await recombeeClient.send(setItemValuesRequest);
        } catch (recombeeError) {
            console.error('Recombee error, proceeding with MongoDB deletion:', recombeeError);
        }

        // Delete the file from Google Cloud Storage
        const fileUrl = contentDocument.fileUrl;
        // Extract bucket name and file path from fileUrl
        const matches = fileUrl.match(/https:\/\/firebasestorage.googleapis.com\/v0\/b\/([^\/]+)\/o\/([^?]+)/);
        if (matches && matches.length >= 3) {
            const bucketName = matches[1];
            const filePath = decodeURIComponent(matches[2]);
            await storage.bucket(bucketName).file(filePath).delete();
            console.log(`File ${filePath} deleted from bucket ${bucketName}.`);
        } else {
            console.warn('Could not extract bucket name and file path from URL:', fileUrl);
            // Consider how to handle this case. Maybe log an error or even halt the deletion process, depending on your requirements.
        }

        // Proceed to delete the document with the specified videoId in MongoDB
        const result = await collection.deleteOne({ videoId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Video not found' });
        }

        res.status(200).json({ message: 'Video deleted successfully' });
    } catch (error) {
        console.error('Error deleting content:', error);
        return res.status(500).json({ message: 'Server error' });
    } finally {
        if (client) {
            await client.close();
        }
    }
};

const postNewAlbum = async (req, res) => {
const { albumId, owner, timestamp } = req.body;
    const AlbumMetaData = {
        owner,
        timestamp,
        albumId,
        albumName: '',
        contentType: 'AlbumMetaData',
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
    const { albumId, title, description, visibility, albumOrder, albumImageUrl } = req.body;
    const client = await MongoClient.connect(MONGO_URI, options);
    try {
        const db = client.db("db-name");
        const collection = db.collection("AlbumMetaData");
        
        // Log for debugging
        console.log('updateAlbumMetaData: ', albumId, title, description, visibility, albumOrder, albumImageUrl);

        // Construct the update document based on provided fields
        const updateDoc = { $set: {} };
        if (title !== undefined) updateDoc.$set.albumName = title;
        if (description !== undefined) updateDoc.$set.description = description;
        if (visibility !== undefined) updateDoc.$set.visibility = visibility;
        if (albumOrder !== undefined) updateDoc.$set.albumOrder = albumOrder;
        // Conditionally include albumImageUrl if it's provided
        if (albumImageUrl !== undefined) updateDoc.$set.albumImageUrl = albumImageUrl;

        const query = { albumId: albumId };
        const options = { returnOriginal: false };

        const result = await collection.findOneAndUpdate(query, updateDoc, options);

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
};

const updatePartialContentMetaData = async (req, res) => {
    const { videoId, ...updateFields } = req.body;
    console.log("updatePartialContentMetaData - req.body: ", req.body);

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

const updateReviewStatus = async (req, res) => {
    const { videoId, b_isPreparedForReview } = req.body;

    console.log("updateReviewStatus :", videoId, b_isPreparedForReview)
    // Input validation
    if (!videoId || typeof b_isPreparedForReview !== 'boolean') {
        return res.status(400).json({ message: 'Invalid request' });
    }

    // Create a new MongoDB client and connect
    const client = await MongoClient.connect(MONGO_URI, options);
    try {
        const db = client.db("db-name");
        const collection = db.collection("ContentMetaData");

        const result = await collection.updateOne(
            { videoId: videoId },
            { $set: { b_isPreparedForReview: b_isPreparedForReview } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: 'Video not found or no update needed' });
        }

        res.json({ message: 'Review status updated successfully', videoId: videoId });
    } catch (error) {
        console.error('Error updating review status:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        // Ensure that the client will close when you finish/error
        await client.close();
    }
};

const postCoverImage = async (req, res) => {
const { videoId, selectedImageThumbnail } = req.body; 
    const client = await MongoClient.connect(MONGO_URI, options);
    try {
        const db = client.db("db-name");
        const collection = db.collection("ContentMetaData");

        const query = { "videoId": videoId };
        const update = {
            $set: {
                selectedImageThumbnail,
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
}

const postBannerImage = async (req, res) => {
    const { bannerImageUrl, email } = req.body; 
    console.log("bannerImageUrl: ", bannerImageUrl);
    console.log("email: ", email)
    const client = await MongoClient.connect(MONGO_URI, options);
    try {
        const db = client.db("db-name");
        const collection = db.collection("userAccounts");

        const query = { "email": email };
        const update = {
            $set: {
                bannerImageUrl,
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

const updateTrackThumbnail = async (req, res) => {
    console.log('updateTrackThumbnail');
    const { videoId, thumbnailUrl } = req.body;
    const client = await MongoClient.connect(MONGO_URI, options);
    const db = client.db("db-name");

    if (!videoId || !thumbnailUrl) {
        return res.status(400).send("Missing videoId or thumbnailUrl");
    }

    try {
        console.log('thumbnailUrl :', thumbnailUrl)
        const tracksCollection = db.collection('ContentMetaData');

        // Update the thumbnail URL for the given track
        const updateResult = await tracksCollection.updateOne(
            { videoId: videoId }, // No ObjectId conversion if videoId is a string
            { $set: { selectedImageThumbnail: thumbnailUrl } }
        );

        if (updateResult.matchedCount === 0) {
            return res.status(404).send("Track not found");
        }

        res.status(200).send("Thumbnail updated successfully");
    } catch (error) {
        console.error("Error updating track thumbnail:", error);
        res.status(500).send("Internal Server Error");
    } finally {
        client.close();
    }
};

const getVideoMetadataFromVideoId = async (req, res) => {
    const { id } = req.params;
    const client = await new MongoClient(MONGO_URI, options);    
    
    try {
        await client.connect();
        const db = client.db("db-name");
        const videosCollection = db.collection('ContentMetaData'); 
        
        // Query for the video by id
        const video = await videosCollection.findOne({ videoId: id } );
        
        if (!video) {
            // If no video is found, return a 404 response
            return res.status(404).json({ message: 'Video not found' });
        }
        
        // If a video is found, return the video metadata
        return res.status(200).json({
            videoId: video.videoId,
            owner: video.owner,
            title: video.title,
            selectedImageThumbnail: video.selectedImageThumbnail || null,
            fileUrl: video.fileUrl,
        });

        
    } catch (error) {
        console.error("Failed to retrieve video metadata:", error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        await client.close();
    }
};

const getVideoMetadataFromObjectId = async (req, res) => {
    const { id } = req.params;
    const client = await new MongoClient(MONGO_URI, options);

    console.log("getVideoMetadata for: ", id);
    
    
    try {
        await client.connect();
        const db = client.db("db-name");
        const videosCollection = db.collection('ContentMetaData'); 
        
        // Query for the video by id
        const video = await videosCollection.findOne({ _id: new ObjectId(id) } );
        
        if (!video) {
            // If no video is found, return a 404 response
            return res.status(404).json({ message: 'Video not found' });
        }
        
        // If a video is found, return the video metadata
        return res.status(200).json({
            videoId: video.videoId,
            owner: video.owner,
            title: video.title,
            selectedImageThumbnail: video.selectedImageThumbnail || null,
            fileUrl: video.fileUrl,
        });

        
    } catch (error) {
        console.error("Failed to retrieve video metadata:", error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        await client.close();
    }
};

const getAlbumsByArtist = async (req, res) => {
    const client = await new MongoClient(MONGO_URI, options);

    try {
        const { artistId } = req.query; // Assuming artistId is the email of the user
        if (!artistId) {
            return res.status(400).json({ message: 'Missing artistId parameter' });
        }

        await client.connect();
        const db = client.db('db-name');
        // Assuming 'Albums' is the collection where album data is stored
        const albumsCollection = db.collection('AlbumMetaData');

        // Find albums where the 'owner' field matches the artistId (user's email)
        const albums = await albumsCollection.find({ owner: artistId }).toArray();

        if(albums.length === 0) {
            // If no albums are found, send a message indicating such
            return res.status(404).json({ message: 'No albums found for the given artistId' });
        }

        res.json(albums);
    } catch (error) {
        console.error(`An error occurred fetching albums for artistId ${artistId}:`, error);
        return res.status(500).json({ message: 'Server error' });
    } finally {
        if (client) {
            await client.close();
        }
    }
};

const getAlbumById = async (req, res) => {
    const client = await new MongoClient(MONGO_URI, options);
    try {
        await client.connect();
        const db = client.db("db-name");
        const albumsCollection = db.collection('AlbumMetaData');
        const albumId = req.query.albumId; // Retrieve the albumId from query parameters
        const albumDocument = await albumsCollection.findOne({ albumId: albumId });

        if (!albumDocument) {
            return res.status(404).json({ message: 'Album not found' });
        }

        return res.status(200).json(albumDocument);
    } catch (error) {
        console.error(`An error occurred while fetching album by id ${albumId}:`, error);
        return res.status(500).json({ message: 'Server error' });
    } finally {
        await client.close();
    }
};

const deleteAlbum = async (req, res) => {
    const albumId = req.params.albumId;
    const artistId = req.query.artistId; 

    const client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const { recombeeClient } = require("./utils/constants");

    try {
        await client.connect();
        const db = client.db("db-name");
        const collection = db.collection('AlbumMetaData');

        // First, verify that the album belongs to the artist
        const albumDocument = await collection.findOne({ albumId: albumId });
        if (!albumDocument) {
            return res.status(404).json({ message: "Album not found." });
        }

        if (albumDocument.owner !== artistId) {
            return res.status(403).json({ message: "You do not have permission to delete this album." });
        }
        try {
            const itemProperties = { deleted: true };
            const recombeeItemId = albumDocument._id.toString();
            console.log('recombeeItemId :', recombeeItemId);
            const setItemValuesRequest = new SetItemValues(recombeeItemId, itemProperties);
            console.log('setItemValuesRequest', setItemValuesRequest);
            await recombeeClient.send(setItemValuesRequest);
        } catch (recombeeError) {
            console.error('Recombee error, proceeding with MongoDB deletion:', recombeeError);
        }

        // If the artistId matches the album's owner, proceed with the deletion
        await collection.deleteOne({ albumId: albumId });
        res.status(200).json({ message: "Album successfully deleted." });
    } catch (error) {
        console.error(`Failed to delete album: ${error}`);
        res.status(500).json({ message: "Internal server error." });
    } finally {
        await client.close();
    }
};



//Key encoding & decoding
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

const getItemToUserRecommendations = async (req, res) => {
    const userId = req.params.userId;
    const { recombeeClient } = require("./utils/constants");
    
    try {
        const count = 10;

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

const getItemPropertiesFromRecombee = async (req, res) => {
    const itemId = req.params.itemId;

    const { recombeeClient } = require("./utils/constants");
    const rqs = require('recombee-api-client/lib/requests');
    try {
        const response = await recombeeClient.send(new GetItemValues(itemId));
        res.status(200).json({ 
            message: 'Item properties fetched successfully', 
            data: response 
        });
    } catch (error) {
        console.error('Error fetching item properties:', error);
        res.status(500).json({ 
            message: 'Failed to fetch item properties', 
            error: error.message 
        });
    }
}

const getItemToItemRecommendations = async (req, res) => {
    const { itemId, userId } = req.params;
    const { recombeeClient } = require("./utils/constants");
    const count = 3;

    try {
        const recommendItemsToItemRequest = new RecommendItemsToItem(itemId, userId, count, {
                // optional parameters:
                'scenario': 'scenario_2',
                'cascadeCreate': true,
            }
        );

        const response = await recombeeClient.send(recommendItemsToItemRequest).catch(error => {
            console.error("Error sending request to Recombee:", error);
            throw error;
        });
        return res.json(response);
    } catch (err) {
        console.error("Error in getItemToItemRecommendations:", err);
        return res.status(500).json({
            msg: "Internal server error",
            error: err.message || "An error occurred.",
        });
    }
};

const postNewContentTypePropertyWithAttributes = async (req, res) => {
    const client = new MongoClient(MONGO_URI, options);
    try {
        await client.connect();
        const db = client.db('db-name');
        const collections = ['ContentMetaData', 'AlbumMetaData', 'userAccounts'];
        for (const collectionName of collections) {
            const collection = db.collection(collectionName);
            const updateResult = await collection.updateMany(
                {}, 
                { $set: { contentType: collectionName } }
            );
            console.log(`${collectionName} updated count:`, updateResult.modifiedCount);
        }

        res.status(200).json({ status: 200, message: "Content types updated successfully across collections." });
    } catch (e) {
        console.error("Error updating content types:", e.message);
        res.status(400).json({ status: 400, message: e.message });
    } finally {
        await client.close();
    }
};

const getSearchResult = async (req, res) => {
    const { userId, searchQuery } = req.params;
    const { recombeeClient } = require("./utils/constants");
    console.log("user: ", userId);
    console.log("searchQuery: ", searchQuery);
    const count = 5; // Number of items to return

    try {
        // Perform separate searches for tracks, albums, and artists
        const [tracks, albums, artists] = await Promise.all([
            recombeeClient.send(new SearchItems(userId, searchQuery, count, {'scenario': 'tracks_search_scenario'})),
            recombeeClient.send(new SearchItems(userId, searchQuery, count, {'scenario': 'albums_search_scenario'})),
            recombeeClient.send(new SearchItems(userId, searchQuery, count, {'scenario': 'artists_search_scenario'})),
        ]);

        console.log({ tracks, albums, artists });

        // Compile the results into a structured object
        const searchResults = {
            tracks: tracks.recomms,
            albums: albums.recomms,
            artists: artists.recomms,
        };

        // Return the compiled search results
        res.status(200).json(searchResults);
    } catch (error) {
        console.error('Search request failed:', error);
        res.status(500).json({ message: 'Internal server error during search' });
    }
};

const postCreateLiveStream = async (req, res) => {
try {
    const liveStream = await mux.LiveStreams.create({
        playback_policy: ['public'],
        new_asset_settings: { playback_policy: ['public'] },
        });
        res.json(liveStream);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating live stream');
    }
};

const getContentDocumentsByCategory = async (req, res) => {
    const client = new MongoClient(MONGO_URI, options);
    const { category } = req.params;  
    
    try {
        await client.connect();
        const db = client.db("db-name");
        const collection = db.collection('ContentMetaData'); 
        
        // Query for the content by category
        const documents = await collection.find({ category: category }).toArray();
        
        if (!documents) {
            // If no content is found, return a 404 response
            return res.status(404).json({ message: 'Content not found' });
        }
        // Send the found documents in the response
        res.json(documents);
        
    } catch (error) {
        console.error("Failed to retrieve content metadata:", error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        await client.close();
    }
}

const updateContentCategory = async (req, res) => {
    const client = new MongoClient(MONGO_URI, options);
    const { oldCategory, newCategory } = req.body;

    console.log(`Request received to update category from '${oldCategory}' to '${newCategory}'`);

    try {
        await client.connect();
        const db = client.db("db-name");
        const collection = db.collection('ContentMetaData');

        // Log pre-update document count
        const preUpdateCount = await collection.countDocuments({ category: oldCategory });
        console.log(`${preUpdateCount} documents found with category '${oldCategory}'`);

        // Update the category for documents that match the old category
        const updateResult = await collection.updateMany(
            { category: oldCategory },
            { $set: { category: newCategory } }
        );

        console.log(`Update operation details:`, updateResult);

        if (updateResult.matchedCount === 0) {
            console.log('No documents matched the criteria for update.');
            return res.status(404).json({ message: 'No content found to update' });
        }

        console.log(`${updateResult.modifiedCount} documents were updated from '${oldCategory}' to '${newCategory}'`);

        // Send the success response with details of the update operation
        res.json({
            message: 'Content category updated successfully',
            details: updateResult
        });

    } catch (error) {
        console.error("Failed to update content category:", error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        await client.close();
    }
}

const postCreateEvent = async (req, res) => {
    const { title, createdBy, description, dateTime, paymentLink, priceType, priceInThanks } = req.body;

    const event = {
        title,
        createdBy,
        description,
        dateTime,
        priceType,
        paymentLink: priceType === 'ExternalLink' ? paymentLink : '', // Conditionally include paymentLink
        priceInThanks: priceType === 'PricedInThanks' ? priceInThanks : null, // Conditionally include priceInThanks
    };

    const client = new MongoClient(MONGO_URI, options);
    try {
        await client.connect();
        const db = client.db('db-name');
        const result = await db.collection("ArtistEvents").insertOne(event);
        if (result.insertedId) {
            const insertedEvent = await db.collection("ArtistEvents").findOne({ _id: result.insertedId });
            res.status(200).json({ status: 200, event: insertedEvent });
        } else {
            // Handle the case where the document wasn't inserted properly
            res.status(400).json({ status: 400, message: "Event creation failed." });
        }
    } catch (e) {
        console.error("Error creating event:", e.message);
        res.status(500).json({ status: 500, message: e.message });
    } finally {
        await client.close();
    }
};


const postEditEvent = async (req, res) => {
    const { id } = req.params; // Event ID is passed as URL parameter
    const { title, createdBy, description, dateTime, paymentLink, priceType, priceInThanks } = req.body;

    const update = {
        $set: {
            title,
            createdBy,
            description,
            dateTime,
            priceType,
            paymentLink: priceType === 'ExternalLink' ? paymentLink : '', // Conditionally include paymentLink
            priceInThanks: priceType === 'PricedInThanks' ? priceInThanks : null, // Conditionally include priceInThanks
        }
    };

    const client = new MongoClient(MONGO_URI, options);
    try {
        await client.connect();
        const db = client.db('db-name');
        const collection = db.collection("ArtistEvents");

        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            update,
            { returnOriginal: false }
        );

        if (result.value) {
            res.status(200).json({ status: 200, event: result.value });
        } else {
            res.status(404).json({ status: 404, message: "Event not found." });
        }
    } catch (e) {
        console.error("Error editing event:", e.message);
        res.status(400).json({ status: 400, message: e.message });
    } finally {
        await client.close();
    }
};

const postCreateOffer = async (req, res) => {
    const { title, description, file, paymentLink, priceInThanks, priceType } = req.body;
    const offer = {
        title,
        description,
        image: '',
        file,
        priceType,
        paymentLink: priceType === 'ExternalLink' ? paymentLink : '', // Only set paymentLink for ExternalLink priceType
        priceInThanks: priceType === 'PricedInThanks' ? priceInThanks : null, // Only set priceInThanks for PricedInThanks priceType
    };

    const client = await new MongoClient(MONGO_URI, options);
    try {
        await client.connect();
        const db = client.db('db-name');
        const result = await db.collection("ArtistOffers").insertOne(offer);
        res.status(200).json({ status: 200, offer: result.ops[0] });
    } catch (e) {
        console.error("Error creating offer:", e.message);
        res.status(400).json({ status: 400, message: e.message });
    } finally {
        await client.close();
    }
};

const postEditOffer = async (req, res) => {
    const { id } = req.params; // ID is passed as URL parameter
    const { title, description, file, paymentLink, priceInThanks, priceType } = req.body;
    const update = {
        $set: {
            title, 
            description, 
            file, 
            priceType,
            paymentLink: priceType === 'ExternalLink' ? paymentLink : '', // Conditionally include paymentLink
            priceInThanks: priceType === 'PricedInThanks' ? priceInThanks : null, // Conditionally include priceInThanks
        }
    };

    const client = await new MongoClient(MONGO_URI, options);
    try {
        await client.connect();
        const db = client.db('db-name');
        const result = await db.collection("ArtistOffers").findOneAndUpdate(
            { _id: new ObjectId(id) },
            update,
            { returnOriginal: false }
        );
        if (result.value) {
            res.status(200).json({ status: 200, offer: result.value });
        } else {
            res.status(404).json({ status: 404, message: "Offer not found" });
        }
    } catch (e) {
        console.error("Error editing offer:", e.message);
        res.status(400).json({ status: 400, message: e.message });
    } finally {
        await client.close();
    }
};

const updateUserLikes = async (req, res) => {
    const { user, videoId, b_isLiking } = req.body;
    const client = await new MongoClient(MONGO_URI, options);

    try {
        await client.connect();
        const db = client.db("db-name");
        const collection = db.collection("userAccounts");

        if (b_isLiking) {
            // Add videoId to the likes array if b_isLiking is true, avoid duplicates using $addToSet
            await collection.updateOne(
                { email: user }, // Assuming userId is an ObjectId, adjust if your ID system differs
                { $addToSet: { likes: videoId } }
            );
        } else {
            // Remove videoId from the likes array if b_isLiking is false
            await collection.updateOne(
                { email: user },
                { $pull: { likes: videoId } }
            );
        }
        res.status(200).json({ message: "User likes updated successfully." });
    } catch (error) {
        console.error("Error updating user likes:", error);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        await client.close();
    }
};

const updateUserFollows = async (req, res) => {
    const { user, artistId, b_isFollowing } = req.body;
    const client = await new MongoClient(MONGO_URI, options);

    try {
        await client.connect();
        const db = client.db("db-name");
        const collection = db.collection("userAccounts");

        if (b_isFollowing) {
            // Add artistId to the follows array if b_isFollowing is true, avoid duplicates using $addToSet
            await collection.updateOne(
                { email: user }, // Assuming userId is an ObjectId, adjust if your ID system differs
                { $addToSet: { follows: artistId } }
            );
        } else {
            // Remove artistId from the follows array if b_isFollowing is false
            await collection.updateOne(
                { email: user },
                { $pull: { follows: artistId } }
            );
        }
        res.status(200).json({ message: "User likes updated successfully." });
    } catch (error) {
        console.error("Error updating user likes:", error);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        await client.close();
    }
};

const updateUserSubscription = async (req, res) => {
    const { userEmail, artistId, b_isSubscribing, thanksCoinsPerMonth } = req.body;
    const client = await new MongoClient(MONGO_URI, options);

    try {
        await client.connect();
        const db = client.db("db-name");
        const collection = db.collection("userAccounts");

        if (b_isSubscribing) {
            // Subscriptions are stored as an array of objects { artistId, thanksCoinsPerMonth }
            await collection.updateOne(
                { email: userEmail },
                { 
                    $addToSet: { 
                        subscriptions: { artistId, thanksCoinsPerMonth } 
                    } 
                }
            );
        } else {
            // When unsubscribing, remove the subscription object matching the artistId
            await collection.updateOne(
                { email: userEmail },
                { 
                    $pull: { 
                        subscriptions: { artistId } 
                    } 
                }
            );
        }
        res.status(200).json({ message: "User subscriptions updated successfully." });
    } catch (error) {
        console.error("Error updating user subscriptions:", error);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        await client.close();
    }
};

const logContentUsage = async (req, res) => {
    const { user, videoId } = req.body;

    // Generate timestamp server-side using current date and time
    const timestamp = new Date().toISOString();

    const contentUsageRecord = {
        user,
        videoId,
        timestamp, //Server-generated timestamp
    };

    const client = new MongoClient(MONGO_URI, options);

    try {
        await client.connect();
        const db = client.db("db-name");
        const collection = db.collection("contentUsage");

        // Insert the content usage record into the collection
        await collection.insertOne(contentUsageRecord);
        
        res.status(200).json({ message: "Content usage logged successfully.", data: contentUsageRecord });
    } catch (error) {
        console.error("Error logging content usage:", error);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        await client.close();
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
    getApprovedVideoContent,
    deleteContent,
    encodeCreds,
    decodeCreds,
    syncCatalog,
    getItemToUserRecommendations,
    getSearchResult,
    addUserOnRecombee,
    setUserOnRecombee,
    getItemPropertiesFromRecombee,
    getItemToItemRecommendations,
    postNewAlbum,
    postAlbumImage,
    updateAlbumMetaData,
    updatePartialContentMetaData,
    updateReviewStatus,
    postCoverImage,
    postBannerImage,
    updateTrackThumbnail,
    getVideoMetadataFromVideoId,
    getVideoMetadataFromObjectId,
    getAlbumsByArtist,
    getAlbumById,
    deleteAlbum,
    postNewContentTypePropertyWithAttributes,
    postCreateLiveStream,
    getContentDocumentsByCategory,
    updateContentCategory,
    postCreateEvent,
    postEditEvent,
    postCreateOffer,
    postEditOffer,
    updateUserLikes,
    updateUserFollows,
    updateUserSubscription,
    logContentUsage
};
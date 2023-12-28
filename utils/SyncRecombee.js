const { MONGO_URI } = process.env;

const { MongoClient } = require("mongodb");

async function getAllContent() {
    const client = new MongoClient(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    try {
        await client.connect();
        const database = client.db("db-name");
        const collection = database.collection("ContentMetaData");

        // Fetch all documents in the collection
        const content = await collection.find({}).toArray();

        return content;
    } finally {
        await client.close();
    }
    }

    const SyncRecombee = async () => {
    try {
        // Fetch all users and videos from MongoDB
        const allContent = await getAllContent();

        // Construct a JSON response with information about all users and videos
        const jsonResponse = {
        success: true,
        users: allUsers,
        content: allContent,
        };

        return jsonResponse;
    } catch (error) {
        console.error("Error in SyncRecombee:", error);

        // Return a JSON response indicating failure
        return {
        success: false,
        error: error.message || "An error occurred during SyncRecombee.",
        };
    }
};

module.exports = {
    SyncRecombee,
};

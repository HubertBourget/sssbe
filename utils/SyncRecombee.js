const { MONGO_URI } = process.env;

const { MongoClient } = require("mongodb");

async function getAllContentFromCollections(collections) {
    const client = new MongoClient(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    try {
        await client.connect();
        const database = client.db("db-name");
        let allContent = [];

        for (const collectionName of collections) {
            const collection = database.collection(collectionName);
            const content = await collection.find({}).toArray();
            allContent = allContent.concat(content.map(item => ({ ...item, contentType: collectionName })));
        }

        return allContent;
    } finally {
        await client.close();
    }
}

const SyncRecombee = async () => {
    try {
        // Specify the collections you want to fetch data from
        const collections = ['ContentMetaData', 'AlbumMetaData', 'userAccounts'];
        
        // Fetch all content from specified collections
        const allContent = await getAllContentFromCollections(collections);

        // Sync the fetched content with Recombee
        // (This part of the code depends on how you're integrating with Recombee's API)
        // For example, you might batch the items by type and send them to different endpoints or handle them differently based on 'contentType'

        const jsonResponse = {
            success: true,
            content: allContent, // This now includes tracks, albums, and artists
        };

        return jsonResponse;
    } catch (error) {
        console.error("Error in SyncRecombee:", error);

        return {
            success: false,
            error: error.message || "An error occurred during SyncRecombee.",
        };
    }
};


module.exports = {
    SyncRecombee,
};

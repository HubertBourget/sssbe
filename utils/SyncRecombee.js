const recombee = require("recombee-api-client");
const rqs = recombee.requests;
const UserRecombee = require("../models/UserRecombee");
const VideoRecombeeModel = require("../models/VideoRecombee");
const { recombeeClient } = require("./constants");
const { MONGO_URI } = process.env;

const { MongoClient } = require("mongodb");

// Replace the connection string with your MongoDB URI
async function getAllUsers() {
  const client = new MongoClient(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    const database = client.db("db-name");
    const collection = database.collection("userAccounts");

    // Fetch all documents in the collection
    const users = await collection.find({}).toArray();

    return users;
  } finally {
    await client.close();
  }
}


const SyncRecombee = async () => {
  try {
    // Fetch all users and videos from MongoDB
    const allUsers = await getAllUsers();

    // Construct a JSON response with information about all users and videos
    const jsonResponse = {
      success: true,
      message: "SyncRecombee process completed successfully.",
      users: allUsers,
    }; //   videos: allVideos,

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

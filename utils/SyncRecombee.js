const recombee = require("recombee-api-client");
const rqs = recombee.requests;
const UserRecombee = require("../models/UserRecombee");
const VideoRecombeeModel = require("../models/VideoRecombee");
const { recombeeClient } = require("./constants");

const SyncRecombee = async () => {
  try {
    // Fetch all users and videos from MongoDB
    console.log("here1");
    const allUsers = await UserRecombee.find({});
    console.log("here2");
    // const allVideos = await VideoRecombeeModel.find({
    //   "VideoMetaData.b_isApproved": true,
    // });
    console.log(allUsers);
    // console.log(allVideos);

    // // Add all users to Recombee
    // await Promise.all(
    //   allUsers.map(async (user) => {
    //     await recombeeClient.send(new rqs.AddUser(user._id));
    //   })
    // );

    // // Add all videos to Recombee
    // await Promise.all(
    //   allVideos.map(async (video) => {
    //     await recombeeClient.send(new rqs.AddItem(video._id));
    //   })
    // );

    // Construct a JSON response with information about all users and videos
    const jsonResponse = {
      success: true,
      message: "SyncRecombee process completed successfully.",
      users: allUsers,
      videos: allVideos,
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

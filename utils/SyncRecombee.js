const recombee = require("recombee-api-client");
const rqs = recombee.requests;
const UserRecombee = require("../models/UserRecombee");
const VideoRecombeeModel = require("../models/VideoRecombee");
const { recombeeClient } = require("./constants");

const SyncRecombee = async () => {
  try {
    // Fetch existing videos and users from Recombee concurrently
    const [existingVideos, existingUsers] = await Promise.all([
      recombeeClient.send(new rqs.ListItems({})),
      recombeeClient.send(new rqs.ListUsers({})),
    ]);

    // Extract existing user and video IDs
    const existingUserIds = existingUsers.map((user) => user.userId);
    const existingVideoIds = existingVideos.map((video) => video.itemId);

    // Fetch new users and videos from the database
    const newUsers = await UserRecombee.find({
      _id: { $nin: existingUserIds },
    });
    const newVideos = await VideoRecombeeModel.find({
      _id: { $nin: existingVideoIds },
      "VideoMetaData.b_isApproved": true,
    });

    // Add new users to Recombee
    await Promise.all(
      newUsers.map(async (user) => {
        await recombeeClient.send(new rqs.AddUser(user._id));
      })
    );

    // Add new videos to Recombee
    await Promise.all(
      newVideos.map(async (video) => {
        await recombeeClient.send(new rqs.AddItem(video._id));
      })
    );

    // Construct a JSON response with information about users and videos
    const jsonResponse = {
      success: true,
      message: "SyncRecombee process completed successfully.",
      users: existingUsers.concat(newUsers),
      videos: existingVideos.concat(newVideos),
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

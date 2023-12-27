const recombee = require("recombee-api-client");
const rqs = recombee.requests;
const UserRecombee = require("../models/UserRecombee");
const VideoRecombeeModel = require("../models/VideoRecombee");
const { recombeeClient } = require("../utils/constants");

const SyncRecombee = async () => {
    try {
        // Fetch existing videoes and users from recombee concurrently
        const [existVideoes, existUsers] = await Promise.all([
        recombeeClient.send(new rqs.ListItems({})),
        recombeeClient.send(new rqs.ListUsers({})),
        ]);

        // Extract existing user and video IDs
        const existingUserIds = existUsers.map((user) => user.userId);
        const existingVideoIds = existVideoes.map((video) => video.itemId);

        // Fetch new users and videos from the database
        const newUsers = await UserRecombee.find({
        _id: { $nin: existingUserIds },
        });
        const newVideoes = await VideoRecombeeModel.find({
        _id: { $nin: existingVideoIds },
        "VideoMetaData.b_isApproved": true,
        });

        // Add new users to Recombee
        await Promise.all(
        newUsers.map(async (usr) => {
            await recombeeClient.send(new rqs.AddUser(usr._id));
        })
        );

        // Add new videos to Recombee
        await Promise.all(
        newVideoes.map(async (vdo) => {
            await recombeeClient.send(new rqs.AddItem(vdo._id));
        })
        );
    } catch (err) {
        console.log("Error in SyncRecombee:", err);
    }
};

module.exports = {
    SyncRecombee,
};

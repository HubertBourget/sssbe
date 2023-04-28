const recombee = require('recombee-api-client');
const rqs = recombee.requests;
const User = require("../models/User");
const Video = require("../models/Video");

/**
 * @description This method will take Ids of all the users and approved videoes from the database. Then it will add new users and videoes(items) to the recombee.
 * @param, Doesn't need pass anything
 * @returns This will not return anything, it will just do all the process in background.
 */
const RecombeeSync = async () => {
    try {
        // create recombee instance
        const client = new recombee.ApiClient(
            process.env.RECOMBEE_DB, 
            process.env.RECOMBEE_API_TOKEN, 
            { regiovarn: process.env.RECOMBEE_REGION },
        );

        // getting existing videoes and users from recombee
        let existVideoes = await client.send(new rqs.ListItems({}));
        let existUsers = await client.send(new rqs.ListUsers({}));
        
        // getting approved videoes and users from our database
        let newUsers = await User.find({ _id: { $nin : existUsers }});
        let newVideoes = await Video.find({ _id: { $nin : existVideoes }, "VideoMetaData.b_isApproved" : true});
        
        newUsers.map((usr) => {
            // adding new user to the recombee
            client.send(new rqs.AddUser(usr._id), function(err, data) {
                if (err) {
                    console.log("err in adduser :: ", err);
                } else {
                    console.log("ok adduser :: ", data);
                }
            });
        });

        newVideoes.map((vdo) => {
            // adding new video to the recombee
            client.send(new rqs.AddItem(vdo._id), function(err, data) {
                if (err) {
                    console.log("err in addvideo :: ", err);
                } else {
                    console.log("ok addvideo :: ", data);
                }
            });
        });
    } catch(err) {
        console.log("err in recombee :: ", err);
    }
}

module.exports = {
    RecombeeSync,
}
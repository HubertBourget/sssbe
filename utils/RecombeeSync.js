const recombee = require('recombee-api-client');
const rqs = recombee.requests;
const User = require("../models/User");
const Video = require("../models/Video");

const RecombeeSync = async () => {
    try {
        const client = new recombee.ApiClient(
            process.env.RECOMBEE_DB, 
            process.env.RECOMBEE_API_TOKEN, 
            { regiovarn: 'eu-west' },
        );

        // getting existing videoes and users
        let existVideoes = await client.send(new rqs.ListItems({}));
        let existUsers = await client.send(new rqs.ListUsers({}));
        
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
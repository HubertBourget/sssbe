const { RecombeeSync } = require("../utils/RecombeeSync");
const recombee = require('recombee-api-client');
const rqs = recombee.requests;
const { recombeeClient, propertyDataTypes } = require("../utils/constants");
const Video = require("../models/Video");
const User = require("../models/User");

/**
 * @method POST
 * @route "/syncCatalog"
 * @description This method will take Ids of all the users and approved videoes from the database. Then it will add new users and videoes(items) to the recombee.
 * @param, No need to pass any params or body
 * @returns This will return success message while other processes like get Ids from database and sync it with the recombee will be run in background.
 */
const SyncCatalog = async function (req, res) {
    try {
        // sync our database with the recombee platform
        RecombeeSync();
        return res.status(200).json({
            msg: "Data syncing successfully."
        });
    } catch (err) {
        console.log('Err in File-RecombeeController > Method-SyncCatalog > : ', err);
        return res.status(400).json({
            msg: "err",
            err: err,
        })
    }
};

/**
 * @method POST
 * @route "/addUserRecommendation"
 * @description This method will take userId itemId(id of video) and numOfRecomms as an input and will add purchase in recombee database and also will return default 5 recomms for user.
 * @param, userId, itemId, numOfRecomms (body)
 * @returns Default it will return 5 recommes for user.
 */
const AddUserRecommendation = async function (req, res) {
    try {
        // get userId and itemId from the body
        let { userId, itemId, numOfRecomms = 5 } = req.body;

        // validate body data
        if (!userId || !itemId) {
            return res.status(400).json({
                err: true,
                error: "Please provide userId and itemId!",
            });
        }

        // find user and item in our database
        let user = await User.findOne({ _id: userId });
        let item = await Video.findOne({ _id: itemId });

        // if user or item not exist in our database then return error
        if (!user || !item) {
            return res.status(400).json({
                err: true,
                error: `${user ? "Item" : "User"} not exist!`,
            });
        }

        // adding recommendation of user
        await recombeeClient.send(new rqs.AddPurchase(userId, itemId, { cascadeCreate: true }));

        // recommend some data to the user
        const recommendations = await recombeeClient.send(new rqs.RecommendItemsToUser(userId, numOfRecomms));

        return res.status(200).json({
            err: false,
            msg: "Recommendation added successfully.",
            data: recommendations,
        });
    } catch (err) {
        console.log('Err in File-RecombeeController > Method-addUserRecommendation > : ', err);
        return res.status(400).json({
            msg: "err",
            err: err,
        });
    }
};

/**
 * @method POST
 * @route "/addItemProperties"
 * @description This api 
 * @param, userId, itemId, numOfRecomms (body)
 * @returns Default it will return 5 recommes for user.
 */
const AddItemProperties = async function (req, res) {
    try {
        // get userId and itemId from the body
        let { name, dataType } = req.body;

        // validate input data
        if (!dataType || !name) {
            return res.status(400).json({
                err: true,
                error: `${dataType ? "Property Name" : "Data Type"} is required!`,
            });
        }

        // validate input data
        if (!propertyDataTypes.includes(dataType)) {
            return res.status(400).json({
                err: true,
                error: "Data type must be include in following list",
                dataTypes: propertyDataTypes,
            });
        }

        // get list of item properties
        let allExistedProperties = await recombeeClient.send(new rqs.ListItemProperties());

        // check if property already exist or not
        let isExist = allExistedProperties.filter((item) => item.name === name);

        // if property already exist then return
        if (isExist.length) {
            return res.status(400).json({
                err: true,
                error: "This property already exist!",
                data: [],
            });
        }

        // adding property to the recombee
        let response = await recombeeClient.send(new rqs.AddItemProperty(name, dataType));

        return res.status(200).json({
            err: false,
            msg: "Recommendation added successfully.",
            data: response,
        });
    } catch (err) {
        console.log('Err in File-RecombeeController > Method-addUserRecommendation > : ', err);
        return res.status(400).json({
            msg: "err",
            err: err,
        });
    }
};

module.exports = {
    SyncCatalog,
    AddUserRecommendation,
    AddItemProperties,
}
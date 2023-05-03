const express = require("express");
const router = express.Router();
const { 
    SyncCatalog, 
    AddUserRecommendation,
    AddItemProperty,
    GetItemProperty,
    DeleteItemProperty,
} = require("../controllers/RecombeeController");

/**
 * @description This method will take Ids of all the users and approved videoes from the database. Then it will add new users and videoes(items) to the recombee.
 * @param, No need to pass any params or body
 * @returns This will return success message while other processes like get Ids from database and sync it with the recombee will be run in background.
 */
router.post("/syncCatalog", SyncCatalog);

/**
 * @description This method will take userId itemId(id of video) and numOfRecomms as an input and will add purchase in recombee database and also will return default 5 recomms for user.
 * @param, userId, itemId, numOfRecomms (body) 
 * @returns Default it will return 5 recommes for user.
 */
router.post("/addUserRecommendation", AddUserRecommendation);

/**
 * @description This method will add properties of item like title, category, description into the recombee.
 * @param, name, dataType (body) 
 * @returns It will return just success response.
 */
router.post("/addItemProperty", AddItemProperty);

/**
 * @description This method will get all the properties of the item which is added to the recombee.
 * @param, No need to pass anything
 * @returns It will return array of all the properties.
 */
router.get("/getItemProperty", GetItemProperty);

/**
 * @description This api will delete the item property.
 * @param, name (body)
 * @returns It will return success response.
 */
router.post("/deleteItemProperty", DeleteItemProperty);

module.exports = router;
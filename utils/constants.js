const path = require("path");
const recombee = require('recombee-api-client');

// google cloud storage class
const { Storage } = require('@google-cloud/storage');

// folder in which new created thumbnails will be stored for temperory time
const thumbnailDir = './Thumbnails';

// create instance of storage with our credentials   
const storage = new Storage();

// getting google cloud storage bucket
const bucket = storage.bucket(process.env.BUCKET_NAME);

// create instance of recombee api client
const recombeeClient = new recombee.ApiClient(
    process.env.RECOMBEE_DB, 
    process.env.RECOMBEE_API_TOKEN, 
    { regiovarn: process.env.RECOMBEE_REGION },
);

module.exports = {
    thumbnailDir,
    storage,
    bucket,
    recombeeClient,
}
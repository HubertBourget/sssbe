const path = require("path");
const fs = require("fs");
const recombee = require("recombee-api-client");

// create instance of recombee api client
const recombeeClient = new recombee.ApiClient(
  process.env.RECOMBEE_DB,
  process.env.RECOMBEE_API_TOKEN,
  { region: process.env.RECOMBEE_REGION}
);

// property of item should be contain data type from this
const propertyDataTypes = [
  "int",
  "double",
  "string",
  "boolean",
  "timestamp",
  "set",
  "image",
  "imageList",
];

// create josn file of GCS credentials from env buffer data
function createCredsFromEnv() {
    const data = new Buffer.from(process.env.CREDS, 'base64').toString('ascii');
    fs.writeFileSync(path.join(__dirname, "../GCS-auth-creds.json"), data);        
}

// getting google cloud storage bucket
const bucket = storage.bucket(process.env.BUCKET_NAME);

module.exports = {
  recombeeClient,
  propertyDataTypes,
  bucket,
  createCredsFromEnv,
};
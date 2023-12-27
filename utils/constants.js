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

module.exports = {
  recombeeClient,
  propertyDataTypes,
};
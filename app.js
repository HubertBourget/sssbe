require('dotenv').config()
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const thumbnailRouter = require("./routes/ThumbnailRoutes");

mongoose.connect(process.env.DB_URL).then(() => {
    console.log("DB connected successfully...");
}).catch(err => {
    console.log("Err in DB connection :: ", err);
});

app.use(express.json());
app.use("/", thumbnailRouter);

app.listen(process.env.PORT, () => {
    console.log("Listening to the port :: ", process.env.PORT);
});



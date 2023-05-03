require('dotenv').config()
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const ThumbnailRouter = require("./routes/ThumbnailRoutes");
const RecombeeRoutes = require("./routes/RecombeeRoutes");

// connection with mongodb
mongoose.connect(process.env.DB_URL).then(() => {
    console.log("DB connected successfully...");
}).catch(err => {
    console.log("Err in DB connection :: ", err);
});

app.use(express.json());
app.use("/", ThumbnailRouter);
app.use("/", RecombeeRoutes);

app.listen(process.env.PORT, () => {
    console.log("Listening to the port :: ", process.env.PORT);
});

const mongoose = require("mongoose");

const videoSchema = mongoose.Schema({
    videoUrl: {
        type: String,
        required: true,
    },
    thumbnailImage: [ {type: String} ]
}, {
    timestamps: true,
});

const Video = mongoose.model("videos", videoSchema);

module.exports = Video;
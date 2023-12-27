const mongoose = require("mongoose");

const videoSchema = mongoose.Schema(
  {
    videoUrl: {
      type: String,
      required: true,
    },
    VideoMetaData: {
      videoOwner: { type: String },
      videoId: { type: String },
      originalFileName:{ type: String },
      b_isPreparedForReview: { type: Boolean },
      b_hasBeenReviewed: { type: Boolean },
      b_isApproved: { type: Boolean },
      fileUrl: { type: String },
      title: { type: String },
      description: { type: String },
      category: { type: String },
    },
    thumbnailImage: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

const VideoRecombeeModel = mongoose.model("videos", videoSchema);

module.exports = VideoRecombeeModel;
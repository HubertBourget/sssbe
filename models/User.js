const mongoose = require("mongoose");

const videoSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
}, {
    timestamps: true,
});

const User = mongoose.model("users", videoSchema);

module.exports = User;
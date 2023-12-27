const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

const UserRecombeeModel = mongoose.model("userAccounts", userSchema);

module.exports = UserRecombeeModel;

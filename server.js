const express = require("express");
const cors = require('cors');
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8000;

const {
  getServerHomePage,
  postContentMetaData,
  getPreReviewedVideoList,
  updateContentMetaData,
  updateUserProfile,
  getUserProfile,
  postProfileImage,
  getCheckAccountName,
  getContentById,
  b_getUserExist,
  postNewUserWithAccountName,
  getContentByArtist,
  getApprovedVideoContent,
  deleteContent,
  encodeCreds,
  decodeCreds,
  syncCatalog,
  getRecommendations,
  addUserOnRecombee,
  setUserOnRecombee,
  postNewAlbum,
  postAlbumImage,
  updateAlbumMetaData,
  updatePartialContentMetaData,
  updateReviewStatus,
  postCoverImage,
  postBannerImage,
} = require("./handlers");

const {
    CreateImageThumbnail,
} = require("./controllers/ThumbnailController");


express()
  .use(
    cors({
      origin: "*", //['https://sacredsound.app', 'https://test.sacredsound.app']
      methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
    })
  )
  .use(express.json())
  .use(bodyParser.json())
  .get("/", getServerHomePage)
  .post("/api/postContentMetaData", postContentMetaData)
  .get("/api/getPreReviewedVideoList", getPreReviewedVideoList)
  .post("/api/updateContentMetaData", updateContentMetaData)
  .post("/api/updateUserProfile", updateUserProfile)
  .get("/api/getUserProfile/:userId", getUserProfile)
  .post("/api/postProfileImage", postProfileImage)
  .get("/api/getCheckAccountName", getCheckAccountName)
  .post("/api/postCreateImageThumbnail", CreateImageThumbnail)
  .get("/api/getContentById", getContentById)
  .get("/api/b_getUserExist/:userId", b_getUserExist)
  .post("/api/postNewUserWithAccountName", postNewUserWithAccountName)
  .get("/api/getContentByArtist", getContentByArtist)
  .get("/api/getApprovedVideoContent", getApprovedVideoContent)
  .delete("/api/deleteContent", deleteContent)
  .post("/api/postNewAlbum", postNewAlbum)
  .post("/api/postAlbumImage", postAlbumImage)
  .post("/api/updateAlbumMetaData", updateAlbumMetaData)
  .post("/api/updatePartialContentMetaData", updatePartialContentMetaData)
  .post('/api/updateReviewStatus', updateReviewStatus)
  .post('/api/postCoverImage', postCoverImage)
  .post('/api/postBannerImage', postBannerImage)

  //Key encryption:
  .post("/api/encodeCreds", encodeCreds)
  .post("/api/decodeCreds", decodeCreds)

  //Recombee:
  .get("/api/syncCatalog", syncCatalog)
  .get("/api/getRecommendations/:userId", getRecommendations)
  // .post("/api/addUserOnRecombee/:userId", addUserOnRecombee) //For Manual Insertion Only!
  // .post("/api/setUserOnRecombee/:userId", setUserOnRecombee) //For Manual Insertion Only!

  .listen(PORT, () => {
    console.log(`Server launched on port ${PORT}`);
  });
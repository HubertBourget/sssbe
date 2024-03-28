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
  getItemToUserRecommendations,
  getSearchResult,
  addUserOnRecombee,
  setUserOnRecombee,
  getItemPropertiesFromRecombee,
  getItemToItemRecommendations,
  postNewAlbum,
  postAlbumImage,
  updateAlbumMetaData,
  updatePartialContentMetaData,
  updateReviewStatus,
  postCoverImage,
  postBannerImage,
  updateTrackThumbnail,
  getVideoMetadataFromVideoId,
  getVideoMetadataFromObjectId,
  getAlbumsByArtist,
  getAlbumById,
  deleteAlbum,
  postNewContentTypePropertyWithAttributes,
  postCreateLiveStream,
  getContentDocumentsByCategory,
  updateContentCategory,
  postCreateEvent,
  postEditEvent,
  postCreateOffer,
  postEditOffer,
  getUserLoves,
  updateUserLoves,
  getUserFavorites,
  updateUserFavorites,
  updateUserSubscription,
  logContentUsage,
} = require("./handlers");

const {
    CreateImageThumbnail,
} = require("./controllers/ThumbnailController");


express()
  .use(
    cors({
      origin: "*", // ['https://sacredsound.app']
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
  .post('/api/updateTrackThumbnail', updateTrackThumbnail)
  .get("/api/getVideoMetaDataFromVideoId/:id", getVideoMetadataFromVideoId)
  .get("/api/getVideoMetaDataFromObjectId/:id", getVideoMetadataFromObjectId)
  .get("/api/getAlbumsByArtist", getAlbumsByArtist)
  .get("/api/getAlbumById", getAlbumById)
  .delete("/api/deleteAlbum/:albumId", deleteAlbum)
  .post("/api/postCreateEvent", postCreateEvent)
  .post("/api/postEditEvent/:id", postEditEvent)
  .post("/api/postCreateOffer", postCreateOffer)
  .post("/api/postEditOffer/:id", postEditOffer)
  .get("/api/getUserLoves", getUserLoves)
  .patch("/api/updateUserLoves", updateUserLoves)
  .get("/api/getUserFavorites", getUserFavorites)
  .patch("/api/updateUserFavorites", updateUserFavorites)
  .patch("/api/updateUserSubscription", updateUserSubscription)
  .post("/api/logContentUsage", logContentUsage)
  

  //Key encryption:
  .post("/api/encodeCreds", encodeCreds)
  .post("/api/decodeCreds", decodeCreds)

  //Recombee:
  .get("/api/syncCatalog", syncCatalog)
  .get("/api/getItemToUserRecommendations/:userId", getItemToUserRecommendations)
  .get("/api/getItemToItemRecommendations/:userId/:itemId", getItemToItemRecommendations)
  .get("/api/getSearchResult/:userId/:searchQuery", getSearchResult)
  .get("/api/getItemPropertiesFromRecombee/:itemId", getItemPropertiesFromRecombee)
  // .post("/api/addUserOnRecombee/:userId", addUserOnRecombee) //For Manual Insertion Only!
  // .post("/api/setUserOnRecombee/:userId", setUserOnRecombee) //For Manual Insertion Only!
  

  //MongoDB data management:
  .post("/api/postNewContentTypePropertyWithAttributes", postNewContentTypePropertyWithAttributes) //used to create the contentType property in ContentMetaData, ConcertMetaData and AlbumMetaData collection
  .get("/api/getContentDocumentsByCategory/:category", getContentDocumentsByCategory) //Database Inspection tool for Content by Category type
  .patch("/api/updateContentCategory", updateContentCategory)

  //Mux endpoint:
  .post("/api/postCreateLiveStream", postCreateLiveStream)

  .listen(PORT, () => {
    console.log(`Server launched on port ${PORT}`);
  });
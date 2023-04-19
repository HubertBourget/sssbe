const express = require("express");
const cors = require('cors');
const PORT = process.env.PORT || 8000;

const {
    getServerHomePage,
    getFavIcon,
    postVideoMetaData,
    getPreReviewedVideoList,
    updateVideoMetaData,
    updateUserProfile,
    getUserProfile,
    postProfileImage,
    checkAccountName,
} = require("./handlers");

express()
    .use(cors())
    .use(express.json())
    .get('/', getServerHomePage)
    .get('/favicon.ico', getFavIcon)
    .post("/api/postVideoMetaData", postVideoMetaData)
    .get("/api/getPreReviewedVideoList", getPreReviewedVideoList)
    .post("/api/updateVideoMetaData", updateVideoMetaData)
    .post("/api/updateUserProfile", updateUserProfile)
    .get('/api/getUserProfile/:userId', getUserProfile)
    .post('/api/postProfileImage', postProfileImage)
    .get('/api/checkAccountName/:username', checkAccountName)

    .listen(PORT, () => {
        console.log(`Server launched on port ${PORT}`);
});

    





const express = require("express");
const PORT = process.env.PORT || 8000;

const {
    postVideoMetaData,
    getPreReviewedVideoList,
    updateVideoMetaData,
    updateUserProfile,
    getUserProfile,
    postProfileImage,
    checkAccountName,
    getServerHomePage,
} = require("./handlers");

express()
    .use(express.json())
    .get('/', getServerHomePage)
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

    





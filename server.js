const express = require("express");
const cors = require('cors');
const PORT = process.env.PORT || 8000;

const {
    getServerHomePage,
    postVideoMetaData,
    getPreReviewedVideoList,
    updateVideoMetaData,
    updateUserProfile,
    getUserProfile,
    postProfileImage,
    checkAccountName,
    getVideoUrlById,
    b_getUserExist,
    postNewUserWithAccountName,
} = require("./handlers");

const {
    postCreateImageThumbnail,
} = require("./controllers/ThumbnailController");


express()
    .use(cors({
    origin: "*", //['https://sacredsound.app/', 'https://test.sacredsound.app/']
    methods: ['GET','POST','DELETE','UPDATE','PUT','PATCH']
    }))
    .use(express.json())
    .get('/', getServerHomePage)
    .post("/api/postVideoMetaData", postVideoMetaData)
    .get("/api/getPreReviewedVideoList", getPreReviewedVideoList)
    .post("/api/updateVideoMetaData", updateVideoMetaData)
    .post("/api/updateUserProfile", updateUserProfile)
    .get('/api/getUserProfile/:userId', getUserProfile)
    .post('/api/postProfileImage', postProfileImage)
    .get('/api/checkAccountName/:username', checkAccountName)
    .post("/api/postCreateImageThumbnail", postCreateImageThumbnail)
    .get('/api/getVideoUrlById', getVideoUrlById)
    .get('/api/b_getUserExist/:userId', b_getUserExist)
    .post('/api/postNewUserWithAccountName', postNewUserWithAccountName)

    .listen(PORT, () => {
        console.log(`Server launched on port ${PORT}`);
});

    





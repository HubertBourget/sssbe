const express = require("express");
const cors = require('cors');
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
} = require("./handlers");

const {
    CreateImageThumbnail,
} = require("./controllers/ThumbnailController");


express()
    .use(cors({
    origin: "*", // ['https://sacredsound.app', 'https://test.sacredsound.app']
    methods: ['GET','POST','DELETE','UPDATE','PUT','PATCH']
    }))
    .use(express.json())
    .get('/', getServerHomePage)
    .post("/api/postContentMetaData", postContentMetaData)
    .get("/api/getPreReviewedVideoList", getPreReviewedVideoList)
    .post("/api/updateContentMetaData", updateContentMetaData)
    .post("/api/updateUserProfile", updateUserProfile)
    .get('/api/getUserProfile/:userId', getUserProfile)
    .post('/api/postProfileImage', postProfileImage)
    .get('/api/getCheckAccountName', getCheckAccountName)
    .post('/api/postCreateImageThumbnail', CreateImageThumbnail)
    .get('/api/getContentById', getContentById)
    .get('/api/b_getUserExist/:userId', b_getUserExist)
    .post('/api/postNewUserWithAccountName', postNewUserWithAccountName)

    .listen(PORT, () => {
        console.log(`Server launched on port ${PORT}`);
});

    





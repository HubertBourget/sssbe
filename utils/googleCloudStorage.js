const { Storage } = require('@google-cloud/storage');

// Initialize Google Cloud Storage instance
const initializeStorage = () => {
    try {
        const encodedData = process.env.ENCODED_KEY;
        if (!encodedData) {
            throw new Error("Encoded Google Cloud credentials not found.");
        }
        const decodedJsonString = Buffer.from(encodedData, "base64").toString("utf-8");
        const credentials = JSON.parse(decodedJsonString);

        const storage = new Storage({
            credentials,
            projectId: process.env.PROJECT_ID,
        });
        console.log("Google Cloud Storage initialized.");
        return storage;
    } catch (error) {
        console.error("Error initializing Google Cloud Storage:", error);
        throw error; // Rethrow or handle as necessary
    }
};

const storage = initializeStorage();

module.exports = storage;

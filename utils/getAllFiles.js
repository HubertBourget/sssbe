const fs = require("fs");
const path = require("path");

async function getFilePaths(directoryPath) {
    try {
        const files = await fs.promises.readdir(directoryPath);
        return files.map((file) => path.join(directoryPath, file));
    } catch (err) {
        console.log('Error getting directory information:', err);
        return [];
    }
};  

module.exports = {
    getFilePaths,
}
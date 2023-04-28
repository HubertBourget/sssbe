const fs = require("fs");
const path = require("path");

/**
 * @description This method will return path of all the files which contains in the directory which we have passed in parameter.
 * @param, directoryPath (directory of the folder of which we want to get all files)
 * @returns It will return array of strings. strings will be path of the file.
 */
async function getFilePaths(directoryPath) {
    try {
        // read all the file names from the directoryPath
        const files = await fs.promises.readdir(directoryPath);

        // return path of all the files which are exist in the directory
        return files.map((file) => path.join(directoryPath, file));
    } catch (err) {
        console.log('Err in File-getAllFiles > Method-getFilePaths > :', err);
        return [];
    }
};  

module.exports = {
    getFilePaths,
}
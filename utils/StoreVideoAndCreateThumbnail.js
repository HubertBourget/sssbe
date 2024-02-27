const path = require("path");
const fse = require("fs-extra");
const ffmpeg = require("fluent-ffmpeg");
const { getFilePaths } = require("./getAllFiles");
const { upload } = require("./uploadToS3");

/**
 * @description This method will take video_url and time_marks(on which second of video we want to create a thumbnail) as an arguments and then first of all it will download the video locally by using the request package. then it will create a thumbnail and will store that thumbnail to the google cloud storage. and at last also will delete the video which downloaded locally.
 * @param, time_marks, video_url (body)
 * @returns This will not return anything, it will just do all the process in background.
 */
const StoreAndUpload = async function (video_url, time_marks) {
  try {
    const directoryPath = path.resolve(__dirname, "../Thumbnails");
    let fileName = "image";

    await new Promise((resolve, reject) => {
      ffmpeg(video_url)
        .screenshots({
          count: 1,
          timemarks: time_marks,
          filename: fileName + ".jpg",
          folder: directoryPath,
        })
        .on("end", () => {
          console.log("Thumbnail created successfully");
          resolve("1");
        })
        .on("error", (err) => {
          console.error("Error creating thumbnail:", err);
          reject(err.message);
        });
    });

    // get paths of all the files contains in "directoryPath"
    const data = await getFilePaths(directoryPath);

    // upload images to the google cloud storage
    let uploadedThumbnailsUrls = await upload(data);
    if (uploadedThumbnailsUrls.err) {
      throw new Error(uploadedThumbnailsUrls.error); // Throw to be caught by the outer try-catch
    }

    // delete all the thumbnails which are generated and stored in directoryPath
    await fse.emptyDir(directoryPath);

    return {
      err: false,
      data: uploadedThumbnailsUrls,
    };
  } catch (err) {
    console.log(
      "Err in File-StoreVideoAndCreateThumbnail > Method-StoreAndUpload > : ",
      err
    );
    return {
      err: true,
      error: err,
    };
  }
};

module.exports = {
  StoreAndUpload,
};

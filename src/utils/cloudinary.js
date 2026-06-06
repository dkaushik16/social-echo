import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadOnCloudinary(filePath) {
  try {
    if (!filePath) return null;

    const res = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
    });
    console.log("File uploaded successfully: ", res);
    fs.unlinkSync(filePath) // remove the locally saved temporary file
    return res
  } catch (error) {
    fs.unlinkSync(filePath) // remove the locally saved temporary file
    return null
  }
}

export {uploadOnCloudinary}

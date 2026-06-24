import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const deleteLocalFile = (filePath) => {
  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    console.warn("Could not delete local file:", filePath, error.message);
  }
};

// UPLOAD ON CLOUDINARY
const uploadOnCloudinary = async (filePath) => {
  if (!filePath) return null;

  try {
    const response = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
    });

    deleteLocalFile(filePath);
    return response;
  } catch (error) {
    console.error("Cloudinary upload failed:", error.message);
    deleteLocalFile(filePath);
    return null;
  }
};

// REMOVE FROM CLOUDINARY
const deleteFromCloudinary = async (url, resourceType = "image") => {
  try {
    if (!url) return null;
    const publicId = url.split("/").pop().split(".")[0];
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return response;
  } catch (error) {
    console.error("Error deleting from cloudinary: ", error);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };

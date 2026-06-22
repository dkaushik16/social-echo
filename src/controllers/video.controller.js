import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

//  GET ALL VIDEOS
const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortType = "desc",
  } = req.query || {};

  const sortOptions = {};

  sortOptions[sortBy] = sortType == "asc" ? 1 : -1;

  const videos = await Video.aggregate([
    { $match: { isPublished: true } },
    { $sort: sortOptions },
    { $skip: (Number(page) - 1) * Number(limit) },
    { $limit: Number(limit) },
  ]);
  if (!videos) {
    throw new ApiError(500, "Failed to fetch videos");
  }
  
  const totalVideos= await Video.countDocuments({isPublished:true})

  const responseData={
      videos,
      totalVideos,
      currentPage:Number(page),
      totalPages: Math.ceil(totalVideos/limit)
  }

  return res
    .status(200)
    .json(new ApiResponse(200, responseData, "Videos fetched successfully"));
});

//  PUBLISH A VIDEO
const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body || {};

  if (!title) {
    throw new ApiError(400, "Title is required");
  }
  if (!description) {
    throw new ApiError(400, "Description is required");
  }

  if (!req.files?.videoFile) {
    throw new ApiError(400, "Video file is required");
  }
  if (!req.files?.thumbnail) {
    throw new ApiError(400, "Thumbnail is required");
  }

  const videoFileLocalPath = req.files.videoFile[0]?.path;
  const thumbnailLocalPath = req.files.thumbnail[0]?.path;

  const video_cloudinary = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail_cloudinary = await uploadOnCloudinary(thumbnailLocalPath);

  if (!video_cloudinary?.url || !thumbnail_cloudinary?.url) {
    throw new ApiError(
      500,
      "Something went wrong while uploading video file and thumbnail"
    );
  }

  const newVideo = await Video.create({
    videoFile: video_cloudinary.url,
    thumbnail: thumbnail_cloudinary.url,
    title: title,
    description: description,
    duration: video_cloudinary.duration,
    owner: req.user?._id,
  });

  if (!newVideo) {
    throw new ApiError(500, "Something went wrong while publishing the video");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, newVideo, "Video published successfully"));
});

export { getAllVideos, publishVideo };

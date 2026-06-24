import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import mongoose from "mongoose";

//  GET ALL VIDEOS
const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query || {};

  // --- Validate pagination params ---
  let pageNum = Number(page);
  let limitNum = Number(limit);

  if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
  if (isNaN(limitNum) || limitNum < 1) limitNum = 10;
  limitNum = Math.min(limitNum, 30); // cap to prevent abuse

  // --- Validate sort field (whitelist) ---
  const allowedSortFields = ["createdAt", "views", "duration", "title"];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const sortOrder = sortType === "asc" ? 1 : -1;

  // --- Build match stage ---
  const matchStage = { isPublished: true };

  if (search?.trim()) {
    matchStage.$or = [
      { title: { $regex: search.trim(), $options: "i" } },
      { description: { $regex: search.trim(), $options: "i" } },
    ];
  }

  if (userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, "Invalid userId");
    }
    matchStage.owner = new mongoose.Types.ObjectId(userId);
  }

  // --- Build aggregation pipeline (without skip/limit) ---
  const videoAggregate = Video.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              fullname: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    { $unwind: "$owner" },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        isPublished: 1,
        createdAt: 1,
        owner: 1,
      },
    },
    { $sort: { [sortField]: sortOrder } },
  ]);

  // --- Paginate ---
  const options = {
    page: pageNum,
    limit: limitNum,
  };

  const result = await Video.aggregatePaginate(videoAggregate, options);

  if (!result) {
    throw new ApiError(500, "Failed to fetch videos");
  }

  const responseData = {
    videos: result.docs,
    videosOnThisPage: result.docs.length,
    totalVideos: result.totalDocs,
    currentPage: result.page,
    totalPages: result.totalPages,
    hasNextPage: result.hasNextPage,
    hasPrevPage: result.hasPrevPage,
  };

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

//  GET VIDEO BY ID
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId).populate(
    "owner",
    "fullname username avatar"
  );

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Optional: restrict unpublished videos to the owner only
  if (
    !video.isPublished &&
    video.owner._id.toString() !== req.user?._id?.toString()
  ) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

//  UPDATE THE VIDEO
const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body || {};

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Ownership check
  if (!video.owner.equals(req.user?._id)) {
    throw new ApiError(403, "You are not authorized to update this video");
  }

  const updateFields = {};

  if (title) updateFields.title = title;
  if (description) updateFields.description = description;

  // thumbnail update handling
  let oldThumbnailUrl = null;
  if (req.file) {
    const thumbnailLocalPath = req.file?.path;
    const thumbnail_cloudinary = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail_cloudinary?.url) {
      throw new ApiError(500, "Something went wrong while uploading thumbnail");
    }

    oldThumbnailUrl = video.thumbnail;
    updateFields.thumbnail = thumbnail_cloudinary.url;
  }

  if (Object.keys(updateFields).length === 0) {
    throw new ApiError(400, "At least one field is required to update");
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { $set: updateFields },
    { new: true }
  );

  if (!updatedVideo) {
    throw new ApiError(500, "Something went wrong while updating the video");
  }

  if (oldThumbnailUrl) {
    deleteFromCloudinary(oldThumbnailUrl);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

//  DELETE THE VIDEO
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Ownership check
  if (!video.owner.equals(req.user?._id)) {
    throw new ApiError(403, "You are not authorized to delete this video");
  }

  const deletedVideo = await Video.findByIdAndDelete(videoId);

  if (!deletedVideo) {
    throw new ApiError(500, "Something went wrong while deleting the video");
  }

  // Clean up Cloudinary assets after successful DB deletion
  deleteFromCloudinary(video.thumbnail, "image");
  deleteFromCloudinary(video.videoFile, "video");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

// TOGGLE PUBLISH STATUS
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Ownership check
  if (!video.owner.equals(req.user?._id)) {
    throw new ApiError(403, "You are not authorized to update this video");
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { $set: { isPublished: !video.isPublished } },
    { new: true }
  );

  if (!updatedVideo) {
    throw new ApiError(
      500,
      "Something went wrong while toggling publish status"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedVideo,
        `Video ${updatedVideo.isPublished ? "published" : "unpublished"} successfully`
      )
    );
});

export {
  getAllVideos,
  publishVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};

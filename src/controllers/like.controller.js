import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/like.model.js";
import mongoose from "mongoose";

//  VIDEO LIKE TOGGLE HANDLER
const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }
 
  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });

  if (existingLike) {
    // already liked - remove the like
    await Like.findByIdAndDelete(existingLike._id);

    return res
      .status(200)
      .json(
        new ApiResponse(200, { isLiked: false }, "Video unliked successfully")
      );
  }

  // not liked yet - add the like
  const newLike = await Like.create({
    video: videoId,
    likedBy: req.user._id,
  });

  if (!newLike) {
    throw new ApiError(500, "Something went wrong while liking the video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { isLiked: true }, "Video liked successfully"));
});

// GET ALL LIKED VIDEOS
const getLikedVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sortType = "desc", search = "" } = req.query;

  let pageNum = Number(page);
  let limitNum = Number(limit);

  if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
  if (isNaN(limitNum) || limitNum < 1) limitNum = 10;
  limitNum = Math.min(limitNum, 30); // cap to prevent abuse

  const sortOrder = sortType == "asc" ? 1 : -1;

  const videoMatchStage = { isPublished: true };

  if (search.trim()) {
    videoMatchStage["$or"] = [
      { title: { $regex: search.trim(), $options: "i" } },
      { description: { $regex: search.trim(), $options: "i" } },
    ];
  }

  const likeAggregate = Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user._id),
        video: { $exists: true, $ne: null },
      },
    },

    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
        pipeline: [
          { $match: videoMatchStage },
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
        ],
      },
    },

    { $unwind: "$video" },
    { $sort: { createdAt: sortOrder } },
    {
      $project: {
        video: 1,
        likedAt: "$createdAt",
      },
    },
  ]);

  // --- Paginate ---
  const options = { page: pageNum, limit: limitNum };

  const result = await Like.aggregatePaginate(likeAggregate, options);

  if (!result) {
    throw new ApiError(500, "Failed to fetch videos");
  }

  const responseData = {
    likedVideos: result.docs,
    totalLikedVideos: result.totalDocs,
    currentPage: result.page,
    totalPages: result.totalPages,
    hasNextPage: result.hasNextPage,
    hasPrevPage: result.hasPrevPage,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(200, responseData, "Liked videos fetched successfully")
    );
});

export { toggleVideoLike, getLikedVideos };

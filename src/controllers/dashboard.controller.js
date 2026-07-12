import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";

// TO GET ALL VIDEOS UPLOADED BY CHANNEL
const getChannelVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    sortBy = "createdAt",
    sortType = "desc",
  } = req.query || {};

  let pageNum = Number(page);
  let limitNum = Number(limit);

  if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
  if (isNaN(limitNum) || limitNum < 1) limitNum = 10;
  limitNum = Math.min(limitNum, 30);

  const allowedSortFields = ["createdAt", "views", "duration", "title"];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const sortOrder = sortType === "asc" ? 1 : -1;

  const matchStage = { owner: new mongoose.Types.ObjectId(req.user._id) };

  if (search?.trim()) {
    matchStage.$or = [
      { title: { $regex: search.trim(), $options: "i" } },
      { description: { $regex: search.trim(), $options: "i" } },
    ];
  }

  const videoAggregate = Video.aggregate([
    { $match: matchStage },
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
      },
    },
    { $sort: { [sortField]: sortOrder } },
  ]);

  const options = { page: pageNum, limit: limitNum };

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

// TO GET CHANNEL STATS
const getChannelStats = asyncHandler(async (req, res) => {
  const channelId = new mongoose.Types.ObjectId(req.user._id);

  const stats = await Video.aggregate([
    // match only this channel's videos
    { $match: { owner: channelId } },

    // lookup likes for each video
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "videoLikes",
      },
    },

    // group all videos together to compute totals
    {
      $group: {
        _id: null,
        totalVideos: { $sum: 1 },
        totalLikes: { $sum: { $size: "$videoLikes" } },
        totalViews: { $sum: "$views" },
      },
    },

    // lookup subscribers separately
    {
      $lookup: {
        from: "subscriptions",
        pipeline: [{ $match: { channel: channelId } }, { $count: "total" }],
        as: "subscriberData",
      },
    },
    {
      $project: {
        _id: 0,
        totalVideos: 1,
        totalLikes: 1,
        totalViews: 1,
        totalSubscribers: {
          $ifNull: [{ $arrayElemAt: ["$subscriberData.total", 0] }, 0],
        },
      },
    },
  ]);

  const channelStats = stats[0] || {
    totalVideos: 0,
    totalViews: 0,
    totalLikes: 0,
    totalSubscribers: 0,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(200, channelStats, "Channel stats fetched successfully")
    );
});

export { getChannelVideos, getChannelStats };

import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Tweet } from "../models/tweet.model.js";

// TWEET CREATE HANDLER
const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body || {};

  const trimmedContent = content?.trim();

  if (!trimmedContent) {
    throw new ApiError(400, "content is required");
  }

  if (trimmedContent.length > 280) {
    throw new ApiError(400, "Content cannot exceed 280 characters");
  }

  const newTweet = await Tweet.create({
    content: trimmedContent,
    owner: req.user._id,
  });

  if (!newTweet) {
    throw new ApiError(500, "Something went wrong while creating tweet");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, newTweet, "Tweet created successfully"));
});

// GET USER TWEETS
const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10, sortType = "desc", search = "" } = req.query;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  let pageNum = Number(page);
  let limitNum = Number(limit);

  if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
  if (isNaN(limitNum) || limitNum < 1) limitNum = 10;
  limitNum = Math.min(limitNum, 30);

  const sortOrder = sortType == "asc" ? 1 : -1;

  const matchCondition = { owner: new mongoose.Types.ObjectId(userId) };

  if (search.trim()) {
    matchCondition.content = { $regex: search.trim(), $options: "i" };
  }

  const tweetAggregate = Tweet.aggregate([
    { $match: matchCondition },
    { $project: { content: 1, createdAt: 1 } },
    { $sort: { createdAt: sortOrder } },
  ]);

  const options = { page: pageNum, limit: limitNum };

  const result = await Tweet.aggregatePaginate(tweetAggregate, options);

  if (!result) {
    throw new ApiError(500, "Failed to fetch tweets");
  }

  const responseData = {
    tweets: result.docs,
    totalTweets: result.totalDocs,
    currentPage: result.page,
    totalPages: result.totalPages,
    hasNextPage: result.hasNextPage,
    hasPrevPage: result.hasPrevPage,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, responseData, "Tweets fetched successfully"));
});

// TWEET UPDATE HANDLER
const updateTweet = asyncHandler(async (req, res) => {
  const { content } = req.body || {};
  const { tweetId } = req.params;

  if (!tweetId || !mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "Invalid tweet id");
  }

  const trimmedContent = content?.trim();

  if (!trimmedContent) {
    throw new ApiError(400, "content is required");
  }

  if (trimmedContent.length > 280) {
    throw new ApiError(400, "Content cannot exceed 280 characters");
  }

  const oldTweet = await Tweet.findById(tweetId);

  if (!oldTweet) {
    throw new ApiError(404, "Tweet not found");
  }

  // ownership check
  if (!oldTweet.owner.equals(req.user._id)) {
    throw new ApiError(403, "You are not authorized to update this tweet");
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: { content: trimmedContent },
    },
    { new: true }
  );
  if (!updatedTweet) {
    throw new ApiError(500, "Failed to update the tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
});

// TWEET DELETE HANDLER
const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId || !mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "Invalid tweet id");
  }

  const existingTweet = await Tweet.findById(tweetId);

  if (!existingTweet) {
    throw new ApiError(404, "Tweet not found");
  }

  // ownership check
  if (!existingTweet.owner.equals(req.user._id)) {
    throw new ApiError(403, "You are not authorized to delete this tweet");
  }

  const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

  if (!deletedTweet) throw new ApiError(500, "Failed to delete the tweet");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };

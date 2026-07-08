import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";

// TOGGLE SUBSCRIPTION CONTROLLER
const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId || !mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid channel id");
  }

  const channel = await User.findById(channelId);

  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  // self subscription check
  if (req.user._id.equals(channelId)) {
    throw new ApiError(400, "You cannot subscribe to your own channel");
  }

  const existingSubscription = await Subscription.findOne({
    subscriber: req.user._id,
    channel: channelId,
  });

  if (existingSubscription) {
    // already subscribed - remove the subscription
    await Subscription.findByIdAndDelete(existingSubscription._id);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isSubscribed: false },
          "Unsubscribed successfully"
        )
      );
  }

  const newSubscription = await Subscription.create({
    subscriber: req.user._id,
    channel: channelId,
  });

  if (!newSubscription) {
    throw new ApiError(
      500,
      "Something went wrong while subscribing to the channel"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { isSubscribed: true }, "Subscribed successfully")
    );
});

// CONTROLLER TO FETCH SUBSCRIBERS OF A CHANNEL
const getChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const { page = 1, limit = 10, sortType = "desc", search = "" } = req.query;

  if (!channelId || !mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid channel id");
  }

  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  let pageNum = Number(page);
  let limitNum = Number(limit);

  if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
  if (isNaN(limitNum) || limitNum < 1) limitNum = 10;
  limitNum = Math.min(limitNum, 30);

  const sortOrder = sortType == "asc" ? 1 : -1;

  const subscribersAggregate = Subscription.aggregate([
    { $match: { channel: new mongoose.Types.ObjectId(channelId) } },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
        pipeline: [
          ...(search.trim()
            ? [
                {
                  $match: {
                    $or: [
                      { username: { $regex: search.trim(), $options: "i" } },
                      { fullname: { $regex: search.trim(), $options: "i" } },
                    ],
                  },
                },
              ]
            : []),
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
    { $unwind: "$subscriber" },
    {
      $project: {
        subscriber: 1,
        createdAt: 1,
      },
    },
    { $sort: { createdAt: sortOrder } },
  ]);

  const options = { page: pageNum, limit: limitNum };

  const result = await Subscription.aggregatePaginate(
    subscribersAggregate,
    options
  );

  if (!result) {
    throw new ApiError(500, "Something went wrong while fetching subscribers");
  }

  const responseData = {
    subscribers: result.docs,
    totalSubscribers: result.totalDocs,
    currentPage: result.page,
    totalPages: result.totalPages,
    hasNextPage: result.hasNextPage,
    hasPrevPage: result.hasPrevPage,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(200, responseData, "Subscribers fetched successfully")
    );
});

//CONTROLLER TO FETCH SUBSCRIBED CHANNELS OF A USER
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sortType = "desc", search = "" } = req.query;

  let pageNum = Number(page);
  let limitNum = Number(limit);

  if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
  if (isNaN(limitNum) || limitNum < 1) limitNum = 10;
  limitNum = Math.min(limitNum, 30);

  const sortOrder = sortType === "asc" ? 1 : -1;

  const subscribedChannelsAggregate = Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
        pipeline: [
          ...(search.trim()
            ? [
                {
                  $match: {
                    $or: [
                      { username: { $regex: search.trim(), $options: "i" } },
                      { fullname: { $regex: search.trim(), $options: "i" } },
                    ],
                  },
                },
              ]
            : []),
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
    { $unwind: "$channel" },
    {
      $project: {
        channel: 1,
        createdAt: 1,
      },
    },
    { $sort: { createdAt: sortOrder } },
  ]);

  const options = { page: pageNum, limit: limitNum };

  const result = await Subscription.aggregatePaginate(
    subscribedChannelsAggregate,
    options
  );

  if (!result) {
    throw new ApiError(
      500,
      "Something went wrong while fetching subscribed channels"
    );
  }

  const responseData = {
    subscribedChannels: result.docs,
    totalSubscribedChannels: result.totalDocs,
    currentPage: result.page,
    totalPages: result.totalPages,
    hasNextPage: result.hasNextPage,
    hasPrevPage: result.hasPrevPage,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        responseData,
        "Subscribed channels fetched successfully"
      )
    );
});

export { toggleSubscription, getChannelSubscribers, getSubscribedChannels };

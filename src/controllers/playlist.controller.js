import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";

// CONTROLLER TO CREATE PLAYLIST
const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body || {};
  const trimmedName = name?.trim();
  if (!trimmedName) {
    throw new ApiError(400, "name is required");
  }
  const trimmedDescription = description?.trim();
  if (!trimmedDescription) {
    throw new ApiError(400, "description is required");
  }

  // duplicate playlist check
  const existingPlaylist = await Playlist.findOne({
    name: trimmedName,
    owner: req.user._id,
  });

  if (existingPlaylist) {
    throw new ApiError(409, "Playlist with this name already exists");
  }

  const playlist = await Playlist.create({
    name: trimmedName,
    description: trimmedDescription,
    owner: req.user._id,
    videos: [],
  });

  if (!playlist) {
    throw new ApiError(500, "Something went wrong while creating the playlist");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created successfully"));
});

// CONTROLLER TO GET ALL PLAYLISTS OF A USER
const getUserPlaylists = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sortType = "desc", search = "" } = req.query;

  let pageNum = Number(page);
  let limitNum = Number(limit);

  if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
  if (isNaN(limitNum) || limitNum < 1) limitNum = 10;
  limitNum = Math.min(limitNum, 30);

  const sortOrder = sortType === "asc" ? 1 : -1;

  const matchCondition = { owner: new mongoose.Types.ObjectId(req.user._id) };

  if (search?.trim()) {
    matchCondition["$or"] = [
      { name: { $regex: search.trim(), $options: "i" } },
      { description: { $regex: search.trim(), $options: "i" } },
    ];
  }

  const playlistAggregate = Playlist.aggregate([
    { $match: matchCondition },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          { $match: { isPublished: true } },
          {
            $project: {
              title: 1,
              thumbnail: 1,
              duration: 1,
              views: 1,
            },
          },
        ],
      },
    },

    {
      $project: {
        name: 1,
        description: 1,
        videos: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
    { $sort: { createdAt: sortOrder } },
  ]);

  const options = { page: pageNum, limit: limitNum };

  const result = await Playlist.aggregatePaginate(playlistAggregate, options);

  if (!result) {
    throw new ApiError(500, "Something went wrong while fetching playlists");
  }
  const responseData = {
    playlists: result.docs,
    totalPlaylists: result.totalDocs,
    currentPage: result.page,
    totalPages: result.totalPages,
    hasNextPage: result.hasNextPage,
    hasPrevPage: result.hasPrevPage,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, responseData, "Playlists fetched successfully"));
});

// TO FETCH SINGLE PLAYLIST
const getSinglePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  const playlist = await Playlist.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(playlistId) },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          { $match: { isPublished: true } },
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [{ $project: { username: 1, fullname: 1, avatar: 1 } }],
            },
          },
          { $unwind: "$owner" },
          {
            $project: {
              title: 1,
              thumbnail: 1,
              duration: 1,
              views: 1,
              owner: 1,
              createdAt: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [{ $project: { username: 1, fullname: 1, avatar: 1 } }],
      },
    },
    { $unwind: "$owner" },
    {
      $project: {
        name: 1,
        description: 1,
        videos: 1,
        owner: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  if (!playlist?.length) {
    throw new ApiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist[0], "Playlist fetched successfully"));
});

// TO ADD A VIDEO TO PLAYLIST
const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  if (!videoId) {
    throw new ApiError(400, "videoId is required");
  }

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (!video.isPublished) {
    throw new ApiError(403, "Cannot add an unpublished video to a playlist");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  // ownership check
  if (!playlist.owner.equals(req.user._id)) {
    throw new ApiError(403, "You are not authorized to modify this playlist");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    { $addToSet: { videos: videoId } },
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(
      500,
      "Something went wrong while adding video to playlist"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video added successfully"));
});

// TO REMOVE A VIDEO FROM PLAYLIST
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  // ownership check
  if (!playlist.owner.equals(req.user._id)) {
    throw new ApiError(403, "You are not authorized to modify this playlist");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    { $pull: { videos: videoId } },
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(
      500,
      "Something went wrong while removing the video from playlist"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video removed successfully"));
});

// TO DELETE A PLAYLIST
const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (!playlist.owner.equals(req.user._id)) {
    throw new ApiError(403, "You are not authorized to delete this playlist");
  }

  const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

  if (!deletedPlaylist) {
    throw new ApiError(500, "Something went wrong while deleting the playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});

// TO UPDATE A PLAYLIST
const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body || {};

  if (!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  const trimmedName = name?.trim();
  const trimmedDescription = description?.trim();

  if (!trimmedName && !trimmedDescription) {
    throw new ApiError(
      400,
      "At least one field (name or description) is required to update"
    );
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  //ownership check
  if (!playlist.owner.equals(req.user._id)) {
    throw new ApiError(403, "You are not authorized to update this playlist");
  }

  const updateFields = {};
  if (trimmedName) updateFields.name = trimmedName;
  if (trimmedDescription) updateFields.description = trimmedDescription;

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    { $set: updateFields },
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(500, "Something went wrong while updating the playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getSinglePlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist
};

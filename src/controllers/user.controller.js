import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Helper function to generate access and refresh tokens
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Token generation error: ", error);
    throw new ApiError(500, "Failed to generate tokens");
  }
};

// REGISTER USER
const registerUser = asyncHandler(async (req, res) => {
  // fetch user details from frontend
  const { username, email, fullname, password } = req.body;
  console.log("email: ", email);

  // validations on incoming data
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // check if user already exists
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });

  if (existingUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  // req.files property added by multer middleware
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  // upload avatar and cover image to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : undefined;
  if (!avatar) {
    throw new ApiError(500, "Failed to upload avatar");
  }

  // create entry in database
  const newUser = await User.create({
    username: username.toLowerCase(),
    email,
    fullname,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findById(newUser._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Failed to register user");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

// LOGIN USER
const loginUser = asyncHandler(async (req, res) => {
  const { email, password, username } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  // find user by email or username
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  // password validation
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

// LOGOUT USER
const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  await User.findByIdAndUpdate(
    userId,
    { $set: { refreshToken: null } },
    { new: true }
  );
  return res
    .status(200)
    .clearCookie("refreshToken")
    .clearCookie("accessToken")
    .json(new ApiResponse(200, null, "User logged out successfully"));
});

// ACCESS TOKEN RENEWAL
const renewAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(400, "Refresh token is required");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);
    if (!user || user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    return res
      .status(200)
      .cookie("refreshToken", refreshToken, options)
      .cookie("accessToken", accessToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access token renewed successfully"
        )
      );
  } catch (error) {
    console.error("Error renewing access token: ", error);
    throw new ApiError(401, "Invalid refresh token");
  }
});

// CHANGE PASSWORD
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old and new passwords are required");
  }
  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const isPasswordValid = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid old password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

// GET CURRENT USER
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

// UPDATE THE USER ACCOUNT DETAILS
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body || {};

  if (!fullname && !email) {
    throw new ApiError(
      400,
      "At least one field (fullname or email) is required to update"
    );
  }

  const updatedFields = {};
  if (fullname) updatedFields.fullname = fullname;
  if (email) updatedFields.email = email;

  const user = await User.findByIdAndUpdate(req.user._id, updatedFields, {
    new: true,
  }).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

// UPDATE USER AVATAR
const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path || "";

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const oldAvatarUrl = req.user?.avatar;

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Error while uploading avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { avatar: avatar.url } },
    { new: true }
  ).select("-password -refreshToken");

  // to delete the old avatar from cloudinary if it exists
  deleteFromCloudinary(oldAvatarUrl);

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

// UPDATE USER COVER IMAGE
const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path || "";

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is required");
  }
  const oldCoverImageUrl = req.user?.coverImage;

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage) {
    throw new ApiError(400, "Error while uploading cover image");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { coverImage: coverImage.url } },
    { new: true }
  ).select("-password -refreshToken");

  // to delete the old cover image from cloudinary if it exists
  deleteFromCloudinary(oldCoverImageUrl);

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

// GET USER CHANNEL PROFILE
const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username) {
    throw new ApiError(400, "Username is required");
  }

  const channel = await User.aggregate([
    { $match: { username: username.toLowerCase() } },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscriberCount: { $size: "$subscribers" },
        subscribedToCount: { $size: "$subscribedTo" },
        isSubscribed: {
          $in: [req.user?._id, "$subscribers.subscriber"],
        },
      },
    },
    {
      $project: {
        email: 1,
        fullname: 1,
        username: 1,
        avatar: 1,
        coverImage: 1,
        subscriberCount: 1,
        subscribedToCount: 1,
        isSubscribed: 1,
      },
    },
  ]);

  if (!channel || channel.length === 0) {
    throw new ApiError(404, "Channel not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "Channel profile fetched successfully")
    );
});

// GET USER WATCH HISTORY
const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(req.user._id) } },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
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
  ]);

  if (!user || user.length === 0) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch history fetched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  renewAccessToken,
  changePassword,  
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};

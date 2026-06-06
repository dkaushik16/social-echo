import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
  const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : undefined;
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

export { registerUser };

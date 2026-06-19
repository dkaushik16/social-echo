import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  renewAccessToken,
  changePassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
  getWatchHistory,
  getUserChannelProfile,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import errorHandler from "../middlewares/error.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

// SECURED ROUTES
router.route("/logout").post(verifyToken, logoutUser);
router.route("/refresh-token").post(renewAccessToken);
router.route("/change-password").post(verifyToken, changePassword);
router.route("/current-user").get(verifyToken, getCurrentUser);
router.route("/update-details").patch(verifyToken, updateAccountDetails);

router
  .route("/update-user-avatar")
  .patch(verifyToken, upload.single("avatar"), updateAvatar);

router
  .route("/update-cover-image")
  .patch(verifyToken, upload.single("coverImage"), updateCoverImage);

router.route("/channel/:username").get(verifyToken, getUserChannelProfile);

router.route("/watch-history").get(verifyToken, getWatchHistory);



export default router;

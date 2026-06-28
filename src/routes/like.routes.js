import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  getLikedVideos,
  toggleTweetLike,
  toggleVideoLike,
} from "../controllers/like.controller.js";

const router = Router();

// SECURED ROUTES
router.use(verifyToken);

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/t/:tweetId").post(toggleTweetLike)
router.route("/videos").get(getLikedVideos);

export default router;
 
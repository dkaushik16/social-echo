import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  getLikedVideos,
  toggleVideoLike,
} from "../controllers/like.controller.js";

const router = Router();

// SECURED ROUTES
router.use(verifyToken);

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/videos").get(getLikedVideos);

export default router;

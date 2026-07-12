import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  getChannelStats,
  getChannelVideos,
} from "../controllers/dashboard.controller.js";

const router = Router();

// SECURED ROUTES
router.use(verifyToken);

router.route("/videos").get(getChannelVideos);
router.route("/stats").get(getChannelStats);

export default router;
 
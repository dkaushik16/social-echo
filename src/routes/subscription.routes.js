import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  getChannelSubscribers,
  getSubscribedChannels,
  toggleSubscription,
} from "../controllers/subscription.controller.js";

const router = Router();

// SECURED ROUTES
router.use(verifyToken);

router
  .route("/c/:channelId")
  .post(toggleSubscription)
  .get(getChannelSubscribers);

router.route("/my/channels").get(getSubscribedChannels);

export default router;

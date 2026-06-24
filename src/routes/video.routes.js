import { Router } from "express";
import {
  getAllVideos,
  getVideoById,
  publishVideo,
  updateVideo,
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const uploadOptions = [
  {
    name: "videoFile",
    maxCount: 1,
  },
  {
    name: "thumbnail",
    maxCount: 1,
  },
];

const router = Router();

// SECURED ROUTES
router.use(verifyToken);

router
  .route("/")
  .post(upload.fields(uploadOptions), publishVideo)
  .get(getAllVideos);

router
  .route("/:videoId")
  .get(getVideoById)
  .patch(upload.fields(uploadOptions), updateVideo);

export default router;

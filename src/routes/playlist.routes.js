import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getSinglePlaylist,
  getUserPlaylists,
  removeVideoFromPlaylist,
  updatePlaylist,
} from "../controllers/playlist.controller.js";

const router = Router();

// SECURED ROUTES
router.use(verifyToken);

router.route("/").post(createPlaylist).get(getUserPlaylists);
router
  .route("/:playlistId")
  .get(getSinglePlaylist)
  .delete(deletePlaylist)
  .patch(updatePlaylist);
router
  .route("/:playlistId/video/:videoId")
  .post(addVideoToPlaylist)
  .delete(removeVideoFromPlaylist);

export default router;

import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  renewAccessToken,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

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

export default router;

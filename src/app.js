import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// configuring the cors
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// for form data in json
app.use(express.json({ limit: "16kb" }));

// for the data from the url
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// configuration for static assets
app.use(express.static("public"));

app.use(cookieParser());

// ROUTES IMPORTS
import healthcheckRouter from "./routes/healthcheck.routes.js";
import userRouter from "./routes/user.routes.js";
import errorHandler from "./middlewares/error.middleware.js";
import videoRouter from "./routes/video.routes.js";
import likeRouter from "./routes/like.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import commentRouter from "./routes/comment.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

// ROUTES DECLARATION
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/playlists", playlistRouter);
app.use("/api/v1/dashboard", dashboardRouter);

// NOT FOUND HANDLER
app.use((req, res, next) => {
  const error = new Error(`Route Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  error.errors = [
    "The requested endpoint does not exist or the URL is malformed.",
  ];

  next(error);
});

// ERROR HANDLER
app.use(errorHandler);

export { app };

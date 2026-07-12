```markdown
# Social Echo

![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-0033FF?logo=cloudinary&logoColor=white)

Social Echo is a YouTube-like backend API built with Node.js, Express, MongoDB, and Cloudinary. It provides a complete REST API for authentication, video publishing, social interactions, playlists, subscriptions, and dashboard analytics.

## Features

- User authentication with JWT access and refresh tokens
- Register, login, logout, refresh access token
- Change password, update profile, avatar, and cover image
- Upload, update, delete, publish/unpublish videos
- Fetch videos with pagination, search, sort, and channel filtering
- Add, fetch, update, and delete comments
- Toggle likes on videos, comments, and tweets
- Manage tweets with create, fetch, update, delete
- Subscribe and unsubscribe from channels
- View channel subscribers and subscribed channels
- Create and manage playlists
- Dashboard stats for channel videos, views, likes, and subscribers
- Healthcheck endpoint for service monitoring

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- Cloudinary
- JWT (access + refresh tokens)
- bcrypt
- multer
- cookie-parser
- mongoose-aggregate-paginate-v2

## Project Structure

```text
src/
  controllers/
    auth.controller.js
    video.controller.js
    comment.controller.js
    like.controller.js
    tweet.controller.js
    subscription.controller.js
    playlist.controller.js
    dashboard.controller.js
    health.controller.js
  models/
    user.model.js
    video.model.js
    comment.model.js
    like.model.js
    tweet.model.js
    subscription.model.js
    playlist.model.js
  routes/
    auth.routes.js
    video.routes.js
    comment.routes.js
    like.routes.js
    tweet.routes.js
    subscription.routes.js
    playlist.routes.js
    dashboard.routes.js
    health.routes.js
  middlewares/
    auth.middleware.js
    upload.middleware.js
    error.middleware.js
  utils/
    asyncHandler.js
    ApiError.js
    ApiResponse.js
    cloudinary.js
    pagination.js
  app.js
  server.js
.env
package.json
Readme.md
```

## Getting Started

```bash
git clone https://github.com/<your-username>/social-echo.git
cd social-echo
npm install
cp .env.example .env
```

Configure .env, then run:

```bash
npm run dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port |
| `MONGODB_URI` | MongoDB connection string |
| `CORS_ORIGIN` | CORS origin wildcard or URL |
| `NODE_ENV` | Environment mode (development/production) |
| `ACCESS_TOKEN_SECRET` | Secret for signing access tokens |
| `ACCESS_TOKEN_EXPIRY` | Access token expiration interval |
| `REFRESH_TOKEN_SECRET` | Secret for signing refresh tokens |
| `REFRESH_TOKEN_EXPIRY` | Refresh token expiration interval |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

Example:

```env
PORT=8000
MONGODB_URI=your_mongodb_connection_string
CORS_ORIGIN=*
NODE_ENV=development

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## API Endpoints

### Auth

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register a new user |
| POST | `/api/auth/login` | No | Authenticate and receive access and refresh tokens |
| POST | `/api/auth/logout` | Yes | Logout and clear refresh token |
| GET | `/api/auth/refresh` | No | Refresh access token using refresh token |
| GET | `/api/auth/me` | Yes | Get current authenticated user |
| PATCH | `/api/auth/password` | Yes | Change user password |
| PATCH | `/api/auth/profile` | Yes | Update user account details |
| PATCH | `/api/auth/avatar` | Yes | Update avatar image |
| PATCH | `/api/auth/cover` | Yes | Update cover image |
| GET | `/api/auth/channel/:id` | No | Get channel profile by ID |

### Videos

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/videos` | Yes | Upload a new video |
| GET | `/api/videos` | No | Fetch all videos with pagination, search, and sort |
| GET | `/api/videos/:id` | No | Fetch a video by ID |
| PATCH | `/api/videos/:id` | Yes | Update video title, description, or thumbnail |
| DELETE | `/api/videos/:id` | Yes | Delete a video |
| PATCH | `/api/videos/:id/publish` | Yes | Toggle video publish status |
| GET | `/api/videos/channel/:id` | No | Fetch videos from a specific channel |

### Comments

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/comments` | Yes | Add a comment to a video |
| GET | `/api/comments/:videoId` | No | Fetch comments for a video |
| PATCH | `/api/comments/:id` | Yes | Update a comment |
| DELETE | `/api/comments/:id` | Yes | Delete a comment |

### Likes

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/likes/video/:videoId` | Yes | Toggle like for a video |
| POST | `/api/likes/comment/:commentId` | Yes | Toggle like for a comment |
| POST | `/api/likes/tweet/:tweetId` | Yes | Toggle like for a tweet |
| GET | `/api/likes/videos` | Yes | Get liked videos with pagination and search |

### Tweets

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/tweets` | Yes | Create a tweet |
| GET | `/api/tweets/user/:userId` | No | Get tweets by user |
| PATCH | `/api/tweets/:id` | Yes | Update a tweet |
| DELETE | `/api/tweets/:id` | Yes | Delete a tweet |

### Subscriptions

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/subscriptions/:channelId` | Yes | Toggle subscribe/unsubscribe |
| GET | `/api/subscriptions/channel/:channelId` | No | Get channel subscribers |
| GET | `/api/subscriptions` | Yes | Get subscribed channels |

### Playlists

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/playlists` | Yes | Create a playlist |
| GET | `/api/playlists` | Yes | Get user playlists |
| GET | `/api/playlists/:id` | Yes | Get a single playlist |
| PATCH | `/api/playlists/:id` | Yes | Update playlist details |
| DELETE | `/api/playlists/:id` | Yes | Delete a playlist |
| POST | `/api/playlists/:id/videos` | Yes | Add a video to a playlist |
| DELETE | `/api/playlists/:id/videos/:videoId` | Yes | Remove a video from a playlist |

### Dashboard

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/dashboard/videos` | Yes | Get channel videos with pagination, search, and sort |
| GET | `/api/dashboard/stats` | Yes | Get channel stats |

### Healthcheck

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | No | Check API health and availability |

## Data Models Overview

- User
  - `name`, `email`, `password`, `role`
  - `avatar`, `coverImage`
  - `refreshToken`

- Video
  - `title`, `description`
  - `videoFile`, `thumbnail`
  - `owner`, `duration`, `views`
  - `isPublished`, `createdAt`

- Comment
  - `content`, `video`, `owner`
  - `likes`, `createdAt`

- Like
  - `user`, `targetId`
  - `type` (`video`, `comment`, `tweet`)

- Tweet
  - `content`, `owner`
  - `likes`, `createdAt`

- Subscription
  - `user`, `channel`
  - `createdAt`

- Playlist
  - `title`, `description`, `owner`
  - `videos`, `createdAt`

## Key Design Decisions

- Pagination pattern
  - Uses `mongoose-aggregate-paginate-v2` for consistent pagination across endpoints with aggregate pipelines, search, filtering, and sorting.

- Aggregation pipelines
  - Aggregations are used to compute dashboard statistics, filter query results, and join related data efficiently.

- Cloudinary cleanup
  - Media upload and delete workflows use a Cloudinary utility to remove outdated assets when records are updated or deleted.

- JWT dual-token strategy
  - Access and refresh tokens provide secure session management with short-lived access tokens and refresh token renewal.


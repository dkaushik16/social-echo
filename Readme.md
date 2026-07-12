# Social Echo

![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-0033FF?logo=cloudinary&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?logo=jsonwebtokens&logoColor=white)

Social Echo is a YouTube-like backend REST API built with Node.js, Express, MongoDB, and Cloudinary. It provides a complete API for authentication, video publishing, social interactions, playlists, subscriptions, and dashboard analytics.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)
- [Key Design Decisions](#key-design-decisions)

---

## Features

- JWT-based authentication with access and refresh tokens
- Register, login, logout, refresh access token
- Change password, update profile, avatar, and cover image
- Upload, update, delete, and publish/unpublish videos
- Fetch videos with pagination, search, sort, and channel filtering
- Add, fetch, update, and delete comments on videos
- Toggle likes on videos, comments, and tweets
- Create, fetch, update, and delete tweets (channel community posts)
- Subscribe and unsubscribe from channels
- View channel subscribers and subscribed channels
- Create and manage playlists with add/remove video support
- Channel dashboard with stats: videos, views, likes, and subscribers
- Healthcheck endpoint for service monitoring

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB |
| ODM | Mongoose |
| Media Storage | Cloudinary |
| Authentication | JWT (access + refresh tokens) |
| Password Hashing | bcrypt |
| File Uploads | multer |
| Pagination | mongoose-aggregate-paginate-v2 |

---

## Project Structure

```text
src/
├── controllers/
│   ├── auth.controller.js
│   ├── video.controller.js
│   ├── comment.controller.js
│   ├── like.controller.js
│   ├── tweet.controller.js
│   ├── subscription.controller.js
│   ├── playlist.controller.js
│   ├── dashboard.controller.js
│   └── health.controller.js
├── models/
│   ├── user.model.js
│   ├── video.model.js
│   ├── comment.model.js
│   ├── like.model.js
│   ├── tweet.model.js
│   ├── subscription.model.js
│   └── playlist.model.js
├── routes/
│   ├── auth.routes.js
│   ├── video.routes.js
│   ├── comment.routes.js
│   ├── like.routes.js
│   ├── tweet.routes.js
│   ├── subscription.routes.js
│   ├── playlist.routes.js
│   ├── dashboard.routes.js
│   └── health.routes.js
├── middlewares/
│   ├── auth.middleware.js
│   └── upload.middleware.js
├── utils/
│   ├── asyncHandler.js
│   ├── ApiError.js
│   ├── ApiResponse.js
│   └── cloudinary.js
├── app.js
└── server.js
.env
.env.example
package.json
README.md
```

---

## Getting Started

**1. Clone the repository**

```bash
git clone https://github.com/<your-username>/social-echo.git
cd social-echo
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment variables**

```bash
cp .env.example .env
```

Fill in the required values in `.env` (see [Environment Variables](#environment-variables) below).

**4. Start the development server**

```bash
npm run dev
```

The server will start on the port defined in your `.env` file.

---

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Port the server listens on |
| `MONGODB_URI` | MongoDB connection string |
| `CORS_ORIGIN` | Allowed CORS origin (URL or `*`) |
| `NODE_ENV` | Environment mode (`development` / `production`) |
| `ACCESS_TOKEN_SECRET` | Secret key for signing access tokens |
| `ACCESS_TOKEN_EXPIRY` | Access token expiry duration (e.g. `1d`) |
| `REFRESH_TOKEN_SECRET` | Secret key for signing refresh tokens |
| `REFRESH_TOKEN_EXPIRY` | Refresh token expiry duration (e.g. `10d`) |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |

```env
# .env.example

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

---

## API Endpoints

All routes are prefixed with `/api/v1`.

### Auth

| Method | Route | Auth Required | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Register a new user |
| POST | `/auth/login` | No | Login and receive access + refresh tokens |
| POST | `/auth/logout` | Yes | Logout and clear refresh token |
| GET | `/auth/refresh` | No | Refresh access token using refresh token |
| GET | `/auth/me` | Yes | Get current authenticated user |
| PATCH | `/auth/password` | Yes | Change user password |
| PATCH | `/auth/profile` | Yes | Update account details |
| PATCH | `/auth/avatar` | Yes | Update avatar image |
| PATCH | `/auth/cover` | Yes | Update cover image |
| GET | `/auth/channel/:id` | No | Get channel profile by user ID |

### Videos

| Method | Route | Auth Required | Description |
|---|---|---|---|
| POST | `/videos` | Yes | Upload a new video |
| GET | `/videos` | No | Fetch all videos (pagination, search, sort, filter by user) |
| GET | `/videos/:id` | No | Fetch a video by ID |
| PATCH | `/videos/:id` | Yes | Update video title, description, or thumbnail |
| DELETE | `/videos/:id` | Yes | Delete a video and remove assets from Cloudinary |
| PATCH | `/videos/:id/publish` | Yes | Toggle video publish status |

### Comments

| Method | Route | Auth Required | Description |
|---|---|---|---|
| POST | `/comments/video/:videoId` | Yes | Add a comment to a video |
| GET | `/comments/video/:videoId` | No | Fetch comments for a video (paginated + sorted) |
| PATCH | `/comments/c/:commentId` | Yes | Update a comment |
| DELETE | `/comments/c/:commentId` | Yes | Delete a comment |

### Likes

| Method | Route | Auth Required | Description |
|---|---|---|---|
| POST | `/likes/video/:videoId` | Yes | Toggle like on a video |
| POST | `/likes/comment/:commentId` | Yes | Toggle like on a comment |
| POST | `/likes/tweet/:tweetId` | Yes | Toggle like on a tweet |
| GET | `/likes/videos` | Yes | Get liked videos (paginated + search) |

### Tweets

| Method | Route | Auth Required | Description |
|---|---|---|---|
| POST | `/tweets` | Yes | Create a tweet |
| GET | `/tweets/user/:userId` | No | Get tweets by a specific user (paginated + search) |
| PATCH | `/tweets/:id` | Yes | Update a tweet |
| DELETE | `/tweets/:id` | Yes | Delete a tweet |

### Subscriptions

| Method | Route | Auth Required | Description |
|---|---|---|---|
| POST | `/subscriptions/c/:channelId` | Yes | Toggle subscribe / unsubscribe from a channel |
| GET | `/subscriptions/c/:channelId` | No | Get subscribers of a channel (paginated + search) |
| GET | `/subscriptions/my/channels` | Yes | Get channels the logged-in user subscribes to |

### Playlists

| Method | Route | Auth Required | Description |
|---|---|---|---|
| POST | `/playlists` | Yes | Create a playlist |
| GET | `/playlists` | Yes | Get logged-in user's playlists (paginated + search) |
| GET | `/playlists/:id` | No | Get a single playlist with full video details |
| PATCH | `/playlists/:id` | Yes | Update playlist name or description |
| DELETE | `/playlists/:id` | Yes | Delete a playlist |
| POST | `/playlists/:id/videos/:videoId` | Yes | Add a video to a playlist |
| DELETE | `/playlists/:id/videos/:videoId` | Yes | Remove a video from a playlist |

### Dashboard

| Method | Route | Auth Required | Description |
|---|---|---|---|
| GET | `/dashboard/stats` | Yes | Get channel stats (videos, views, likes, subscribers) |
| GET | `/dashboard/videos` | Yes | Get channel videos (paginated + search + sort) |

### Healthcheck

| Method | Route | Auth Required | Description |
|---|---|---|---|
| GET | `/healthcheck` | No | Check API health and availability |

---

## Data Models

### User
`username`, `email`, `fullName`, `password`, `avatar`, `coverImage`, `refreshToken`, `watchHistory`

### Video
`title`, `description`, `videoFile`, `thumbnail`, `owner`, `duration`, `views`, `isPublished`

### Comment
`content`, `video`, `owner`

### Like
`video`, `comment`, `tweet`, `likedBy`

### Tweet
`content`, `owner`

### Subscription
`subscriber`, `channel`

### Playlist
`name`, `description`, `videos`, `owner`

---

## Key Design Decisions

**Pagination with aggregation pipelines**
All list endpoints use `mongoose-aggregate-paginate-v2` with MongoDB aggregation pipelines — enabling consistent pagination alongside `$lookup` joins, `$match` filters, and `$sort` in a single pipeline. This avoids the limitations of plain `.find().skip().limit()` once joins and computed fields are involved.

**Polymorphic Like model**
A single `Like` model handles likes for videos, comments, and tweets via optional reference fields (`video`, `comment`, `tweet`). Only one field is populated per like document, keeping the schema flexible without needing separate like collections per entity.

**Cloudinary cleanup on update/delete**
When a video or thumbnail is updated or a video is deleted, the old Cloudinary asset is explicitly deleted after the database operation succeeds. This prevents orphaned media files and keeps storage clean. Deletion always follows a successful DB write — never before — to avoid data loss if the DB operation fails.

**JWT dual-token strategy**
Short-lived access tokens handle request authentication. Long-lived refresh tokens stored in the database allow silent token renewal without requiring the user to log in again. On logout, the refresh token is invalidated server-side.

**Ownership checks on all mutations**
Every update, delete, and toggle operation fetches the resource first to verify the `owner` field matches `req.user._id` using Mongoose's `.equals()` method before proceeding. This prevents unauthorized modifications regardless of how the API is called.

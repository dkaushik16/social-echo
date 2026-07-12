# Social Echo

![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-0033FF?logo=cloudinary&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?logo=jsonwebtokens&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue)

Social Echo is a production-ready YouTube-like backend REST API built with Node.js, Express, MongoDB, and Cloudinary. It provides a complete API for authentication, video publishing, social interactions, playlists, subscriptions, and channel dashboard analytics.

**Live API:** `https://social-echo-x6w8.onrender.com/api/v1`

> Free tier — first request after inactivity may take ~30 seconds to wake up. Hit `/healthcheck` first.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Error Handling](#error-handling)
- [Testing with Postman](#testing-with-postman)
- [What I'd Build Next](#whats-next)

---

## Features

- JWT-based authentication with access and refresh tokens via HTTP-only cookies
- Register, login, logout, refresh token, change password
- Update profile details, avatar, and cover image with Cloudinary cleanup
- Upload, update, delete, and publish/unpublish videos
- Fetch videos with pagination, search, sort, and channel filtering
- View counter incremented on each video fetch
- Add, fetch (paginated + sorted), update, and delete comments
- Toggle likes on videos, comments, and tweets
- Create, fetch, update, and delete tweets (channel community posts, max 280 chars)
- Subscribe and unsubscribe from channels
- View channel subscribers and subscribed channels (both paginated + searchable)
- Create and manage playlists with add/remove video support
- Duplicate playlist name prevention per user
- Channel dashboard: total videos, views, likes, and subscriber stats
- Healthcheck endpoint for uptime monitoring

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js v18+ |
| Framework | Express.js v5 |
| Database | MongoDB |
| ODM | Mongoose v9 |
| Media Storage | Cloudinary |
| Authentication | JWT — access + refresh tokens |
| Password Hashing | bcrypt |
| File Uploads | multer (local buffer) → Cloudinary |
| Pagination | mongoose-aggregate-paginate-v2 |
| Code Quality | ESLint + Prettier |

---

## Architecture

### Request Lifecycle

```
Client Request
     │
     ▼
Express App (app.js)
     │
     ▼
Route Layer (/routes)
     │
     ▼
Auth Middleware (verifyToken) ──── Invalid Token ──▶ Error Middleware ──▶ Client
     │
  Valid Token
     │
     ▼
Controller (business logic)
     │
     ├──▶ MongoDB (Mongoose Models)
     │
     └──▶ Cloudinary (media upload/delete)
     │
     ▼
ApiResponse → Client
```

### Media Upload Flow

```
Client (multipart/form-data)
     │
     ▼
multer middleware
     │
     ▼
./public/temp (local buffer)
     │
     ▼
uploadOnCloudinary(filePath)
     │
     ├── Success → save URL to DB → fs.unlinkSync (cleanup local file)
     │
     └── Failure → fs.unlinkSync (cleanup local file) → throw ApiError
```

### JWT Auth Flow

```
Register/Login → access token (1d) + refresh token (10d) → HTTP-only cookies
     │
Secured Request → verifyToken middleware → reads cookie → validates JWT → attaches req.user
     │
Token Expired → POST /refresh-token → new access token issued
     │
Logout → refresh token cleared from DB + cookies cleared
```

---

## Project Structure

```text
src/
├── db/
│   └── index.js                  # MongoDB connection
├── models/
│   ├── user.model.js
│   ├── video.model.js
│   ├── comment.model.js
│   ├── like.model.js
│   ├── tweet.model.js
│   ├── subscription.model.js
│   └── playlist.model.js
├── controllers/
│   ├── user.controller.js
│   ├── video.controller.js
│   ├── comment.controller.js
│   ├── like.controller.js
│   ├── tweet.controller.js
│   ├── subscription.controller.js
│   ├── playlist.controller.js
│   ├── dashboard.controller.js
│   └── healthcheck.controller.js
├── routes/
│   ├── user.routes.js
│   ├── video.routes.js
│   ├── comment.routes.js
│   ├── like.routes.js
│   ├── tweet.routes.js
│   ├── subscription.routes.js
│   ├── playlist.routes.js
│   ├── dashboard.routes.js
│   └── healthcheck.routes.js
├── middlewares/
│   ├── auth.middleware.js
│   ├── multer.middleware.js
│   └── error.middleware.js
├── utils/
│   ├── asyncHandler.js
│   ├── ApiError.js
│   ├── ApiResponse.js
│   └── cloudinary.js
├── app.js
├── constants.js
└── index.js
postman/
└── social-echo.postman_collection.json
.env.example
package.json
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (Atlas free tier or local)
- Cloudinary account (free tier)

### Steps

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

Fill in your credentials — see [Environment Variables](#environment-variables) below.

**4. Start development server**
```bash
npm run dev
```

**5. Verify it's running**
```
GET http://localhost:8000/api/v1/healthcheck
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Port the server listens on |
| `MONGODB_URI` | MongoDB connection string |
| `CORS_ORIGIN` | Allowed CORS origin (URL or `*`) |
| `NODE_ENV` | `development` or `production` |
| `ACCESS_TOKEN_SECRET` | Secret key for signing access tokens |
| `ACCESS_TOKEN_EXPIRY` | Access token expiry (e.g. `1d`) |
| `REFRESH_TOKEN_SECRET` | Secret key for signing refresh tokens |
| `REFRESH_TOKEN_EXPIRY` | Refresh token expiry (e.g. `10d`) |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |

```env
# .env.example

PORT=8000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net
CORS_ORIGIN=*
NODE_ENV=development

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## API Endpoints

All routes are prefixed with `/api/v1`.

**Live base URL:** `https://social-echo-x6w8.onrender.com/api/v1`

### Healthcheck

| Method | Route | Auth | Description |
|---|---|:---:|---|
| GET | `/healthcheck` | No | Verify server is live |

### Auth & User

| Method | Route | Auth | Description |
|---|---|:---:|---|
| POST | `/users/register` | No | Register new user with avatar + cover image |
| POST | `/users/login` | No | Login — sets HTTP-only auth cookies |
| POST | `/users/logout` | Yes | Logout — clears cookies and refresh token |
| POST | `/users/refresh-token` | No | Issue new access token via refresh token |
| POST | `/users/change-password` | Yes | Change account password |
| GET | `/users/current-user` | Yes | Get logged-in user's profile |
| PATCH | `/users/update-details` | Yes | Update fullName or email |
| PATCH | `/users/update-user-avatar` | Yes | Replace avatar image |
| PATCH | `/users/update-cover-image` | Yes | Replace cover image |
| GET | `/users/channel/:username` | Yes | Get public channel profile |
| GET | `/users/watch-history` | Yes | Get watch history |

### Videos

| Method | Route | Auth | Description |
|---|---|:---:|---|
| POST | `/videos` | Yes | Upload a new video |
| GET | `/videos` | Yes | Fetch all videos — `page`, `limit`, `search`, `sortBy`, `sortType`, `userId` |
| GET | `/videos/:videoId` | Yes | Fetch video by ID (increments view count) |
| PATCH | `/videos/:videoId` | Yes | Update title, description, or thumbnail |
| DELETE | `/videos/:videoId` | Yes | Delete video + Cloudinary assets |
| PATCH | `/videos/toggle/publish/:videoId` | Yes | Toggle publish status |

### Comments

| Method | Route | Auth | Description |
|---|---|:---:|---|
| POST | `/comments/:videoId` | Yes | Add comment to a video |
| GET | `/comments/:videoId` | Yes | Get video comments — `page`, `limit`, `sortType` |
| PATCH | `/comments/c/:commentId` | Yes | Update a comment |
| DELETE | `/comments/c/:commentId` | Yes | Delete a comment |

### Likes

| Method | Route | Auth | Description |
|---|---|:---:|---|
| POST | `/likes/toggle/v/:videoId` | Yes | Toggle like on a video |
| POST | `/likes/toggle/c/:commentId` | Yes | Toggle like on a comment |
| POST | `/likes/toggle/t/:tweetId` | Yes | Toggle like on a tweet |
| GET | `/likes/videos` | Yes | Get liked videos — `page`, `limit`, `sortType`, `search` |

### Tweets

| Method | Route | Auth | Description |
|---|---|:---:|---|
| POST | `/tweets` | Yes | Create a tweet (max 280 chars) |
| GET | `/tweets/user/:userId` | Yes | Get user's tweets — `page`, `limit`, `sortType`, `search` |
| PATCH | `/tweets/:tweetId` | Yes | Update tweet content |
| DELETE | `/tweets/:tweetId` | Yes | Delete a tweet |

### Subscriptions

| Method | Route | Auth | Description |
|---|---|:---:|---|
| POST | `/subscriptions/c/:channelId` | Yes | Toggle subscribe/unsubscribe |
| GET | `/subscriptions/c/:channelId` | Yes | Get channel subscribers — `page`, `limit`, `sortType`, `search` |
| GET | `/subscriptions/my/channels` | Yes | Get my subscribed channels — `page`, `limit`, `sortType`, `search` |

### Playlists

| Method | Route | Auth | Description |
|---|---|:---:|---|
| POST | `/playlists` | Yes | Create a playlist |
| GET | `/playlists` | Yes | Get my playlists — `page`, `limit`, `sortType`, `search` |
| GET | `/playlists/:playlistId` | Yes | Get single playlist with full video details |
| PATCH | `/playlists/:playlistId` | Yes | Update playlist name or description |
| DELETE | `/playlists/:playlistId` | Yes | Delete a playlist |
| POST | `/playlists/:playlistId/video/:videoId` | Yes | Add video to playlist |
| DELETE | `/playlists/:playlistId/video/:videoId` | Yes | Remove video from playlist |

### Dashboard

| Method | Route | Auth | Description |
|---|---|:---:|---|
| GET | `/dashboard/stats` | Yes | Channel stats: videos, views, likes, subscribers |
| GET | `/dashboard/videos` | Yes | My uploaded videos — `page`, `limit`, `search`, `sortBy`, `sortType` |

---

## Error Handling

All errors and responses follow a consistent structure across every endpoint.

**Success response** (`ApiResponse`):
```json
{
  "statusCode": 200,
  "data": { },
  "message": "Resource fetched successfully",
  "success": true
}
```

**Error response** (`ApiError` caught by global error middleware):
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Video not found",
  "errors": []
}
```

**Status codes used consistently:**

| Code | When |
|---|---|
| `200` | Successful fetch or update |
| `201` | Successful resource creation |
| `400` | Invalid input or missing required field |
| `401` | Unauthenticated — missing or invalid token |
| `403` | Unauthorized — valid token but not the resource owner |
| `404` | Resource not found |
| `409` | Conflict — duplicate resource (e.g. playlist name) |
| `500` | Internal server error |

Every controller wraps logic in `asyncHandler` — a utility that catches async errors and forwards them to the global error middleware, eliminating try/catch boilerplate across controllers.

---

## Testing with Postman

A pre-configured Postman collection is available in the `/postman` folder.

**Import steps:**
1. Open Postman → **Import** → select `postman/social-echo.postman_collection.json`.
2. Set `baseUrl` in your Postman environment:
   - Local: `http://localhost:8000/api/v1`
   - Live: `https://social-echo-x6w8.onrender.com/api/v1`
3. Run **Auth → Login** first — the auth cookie is captured automatically by Postman for all subsequent secured requests.

> If using Postman in the browser, install the **Postman Interceptor** extension to enable automatic cookie capture.

---

## What I'd Build Next

- **Redis for view deduplication** — currently views increment on every fetch. A Redis TTL key per `userId:videoId` pair would prevent the same user inflating view counts within a time window, matching how real platforms handle this.

- **MongoDB Atlas Search** for full-text search — current `$regex` search works for small datasets but doesn't scale or support relevance ranking, typo tolerance, or stemming. Atlas Search (built on Lucene) would replace `$regex` with production-grade search across videos, tweets, and comments.

- **Real-time notifications** — a Socket.io layer to push events like new subscribers, comments on your video, or likes — keeping users engaged without polling. Paired with a `Notification` model to persist and mark-as-read.

---

*Built by dk16*

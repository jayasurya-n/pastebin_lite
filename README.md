# Pastebin Lite

A minimal Pastebin-like service that allows users to create text pastes and share them via a unique URL.  
Each paste can optionally expire based on time (TTL) or number of views.

This project is implemented as a backend-focused service and is designed to pass automated API-based testing.

---

## Features

- Create a text paste via API
- Generate a shareable URL
- View paste as JSON (API) or HTML (browser)
- Optional constraints:
  - Time-based expiry (TTL)
  - View-count limit
- Deterministic time handling for automated tests

---

## Tech Stack

- Node.js
- Express
- Redis (Serverless redis instance setup with Upstash)

---

## Running Locally

### 1. Install dependencies
npm install

### 2. Create a .env file
REDIS_URL = your-redis-url
TEST_MODE = 0

### 3. Start the server
npm run dev





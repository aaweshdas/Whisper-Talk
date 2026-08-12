<div align="center">
  <img src="./web/public/logo.jpg" alt="Whisper Logo" width="120" height="120" style="border-radius: 24px; margin-bottom: 20px;" />
  <h1>✨ Whisper - Realtime Chat Application ✨</h1>
  <p>A full-stack, production-ready communication platform featuring real-time messaging, WebRTC audio/video calls, and cross-platform support.</p>

  <p>
    <a href="#features"><strong>Features</strong></a> ·
    <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
    <a href="#local-development"><strong>Local Setup</strong></a> ·
    <a href="#deployment"><strong>Deployment</strong></a>
  </p>
</div>

---

## 🚀 Features

- **Real-Time Messaging**: Built from scratch using Socket.IO for instant message delivery without relying on 3rd-party SaaS (like Firebase/Pusher).
- **WebRTC Audio & Video Calls**: Peer-to-peer secure audio and video calling integrated directly into the chat interface.
- **Rich Chat Experience**: 
  - 📎 Image & File Attachments
  - 😃 Emoji Reactions on messages
  - ✏️ Edit & Delete messages
  - ↩️ Threaded Replies
- **Advanced Presence & Receipts**:
  - 🟢 Real-time Online/Offline status (Multi-device aware)
  - ⌨️ Live Typing Indicators
  - ✓✓ Delivered and Read receipts
- **Security & Authentication**:
  - 🔐 Custom JWT Authentication
  - 🌐 Google OAuth Integration
- **Cross Platform**: Seamless experience across the React Web App and Flutter Mobile App sharing the same Express API.

---

## 💻 Tech Stack

### Frontend (Web)
- **Framework**: React 18 (Vite)
- **Styling**: Tailwind CSS, Lucide Icons
- **State Management**: Zustand, React Query (@tanstack/react-query)
- **Real-time & Media**: Socket.IO-Client, Simple-Peer (WebRTC)

### Backend (API)
- **Runtime & Framework**: Node.js, Express, TypeScript
- **Database**: MongoDB (Mongoose)
- **Real-time**: Socket.IO (WebSockets)
- **Storage**: Local Multer uploads (Configurable for S3/Cloudinary)
- **Auth**: JWT, Google Auth Library

---

## 🛠️ Local Development Setup

### 1. Prerequisites
Ensure you have the following installed:
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Flutter SDK (If running the mobile app)

### 2. Environment Variables

Create a `.env` file in the **`/backend`** directory:
```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/whisper
PORT=3000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key

# Comma-separated list of allowed frontend origins (no trailing slashes)
FRONTEND_URL=http://localhost:5173,http://localhost:8081
CLIENT_URL=http://localhost:5173
```

Create a `.env` file in the **`/web`** directory:
```env
VITE_API_URL=http://localhost:3000
```

### 3. Run the Backend

```bash
cd backend
npm install
npm run dev
```
*Note: The backend will run on port 3000.*

### 4. Run the Web Application

```bash
cd web
npm install
npm run dev
```
*Note: The web app will run on port 5173.*

### 5. Run the Mobile Application

```bash
cd flutter_app
flutter pub get
flutter run
```

---

## 🌍 Deployment Guide

This repository is configured for modern cloud deployments. 

### Backend (Render / Heroku)
1. Create a new Web Service on Render connected to this repository.
2. Set the Root Directory to `backend`.
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`
5. Add all the Environment Variables from the backend `.env` section. Make sure `FRONTEND_URL` and `CLIENT_URL` point to your deployed Vercel domain.

### Frontend (Vercel / Netlify)
1. Create a new Project on Vercel connected to this repository.
2. Set the Framework Preset to `Vite`.
3. Set the Root Directory to `web`.
4. Add the Environment Variable `VITE_API_URL` pointing to your deployed Render backend domain.
5. Deploy!

> **Note on Socket.IO CORS**: If you experience connection issues in production, double-check that your `FRONTEND_URL` in the backend exactly matches the domain Vercel assigned to you (without a trailing slash).

---

<div align="center">
  <i>Designed and built with ❤️</i>
</div>

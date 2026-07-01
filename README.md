<h1 align="center">✨ Full-Stack Realtime Chat App (Mobile + Web + API) ✨</h1>

✨ **Highlights:**

- 📱 Fully Functional Real-Time Chat Mobile App (Flutter)
- 💻 Web Chat Application (React) — Same API, Same Features
- 💬 Real-Time Messaging (Built From Scratch — No 3rd Party Services)
- ⌨️ Typing Indicators
- 🟢 Online & Offline Presence
- 🔐 Custom JWT Authentication
- 🌐 Shared Backend for Mobile & Web
- 🧠 Custom Socket Server (No Firebase / Pusher / Ably)
- 🚀 Backend with Bun, Express, MongoDB & TypeScript
- 📡 Real-Time Events & WebSocket Communication
- 🎨 Clean, Modern & Production-Ready UI
- 📱 Cross-Platform Development (iOS, Android & Web)
- 🛠️ REST API Design & Implementation
- 🚀 Deployment on Sevalla (Live API + Web App)
- 🧰 Real-World Git & GitHub Workflow
- 🤖 Automated Code Reviews with CodeRabbit
- 🔒 Secure & Scalable Architecture Best Practices
- 🎯 From Absolute Beginner to Production-Level Real-Time App

---

## 🧪 `.env` Setup

### 🟦 Backend (`/backend`)

```bash
MONGODB_URI=<YOUR_MONGO_URI>

PORT=3000
NODE_ENV=development

JWT_SECRET=<YOUR_JWT_SECRET>

FRONTEND_URL=http://localhost:5173
```

---

### 🟩 Web Version (`/web`)

```bash
VITE_API_URL=<YOUR_DEPLOYED_API_URL>
```

---

### 🟧 Mobile App (`/flutter_app`)

Configure API endpoints inside the Flutter application constants or `.env` equivalent.

---

## 🔧 Run the Backend

```bash
cd backend
bun install
bun run dev
```

---

## 🔧 Run the Web

```bash
cd web
npm install
npm run dev
```

---

## 🔧 Run the Mobile

```bash
cd flutter_app
flutter pub get
flutter run
```

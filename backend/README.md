# Disapp Backend

REST API + **Socket.io (WebSocket)** + **WebRTC signaling** sesuai kontrak API di PRD.

## Fitur

| Layer | Status |
|-------|--------|
| Auth (register/login/refresh/logout) JWT | ✅ |
| Users (me, profile, theme) | ✅ |
| Contacts (add by username) | ✅ |
| Conversations + Messages | ✅ |
| Servers + Channels | ✅ |
| Calls token (WebRTC signaling) | ✅ |
| Stickers packages (mock purchase) | ✅ |
| Socket.io: message, typing, reaction, presence | ✅ |
| WebRTC signal relay (offer/answer/ICE) | ✅ |
| Rate limit 100 req/min | ✅ |
| Helmet + CORS | ✅ |

> **Catatan:** Saat ini memakai **in-memory store** (data hilang saat restart). Siap diganti PostgreSQL + Redis.

## Quick Start

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Server: `http://localhost:3000`  
Demo user: `alex_rivera` / `password123`

## Socket.io Events

Client → Server: `message_send`, `typing_start`, `typing_stop`, `reaction_add`, `call_join`, `webrtc_signal`  
Server → Client: `message_new`, `typing_indicator`, `reaction_add`, `presence_update`, `call_participant_joined`, `call_ended`, `webrtc_signal`

Auth socket:
```js
const socket = io('http://localhost:3000', { auth: { token: accessToken } });
```

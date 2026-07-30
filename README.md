# Disapp

**Hybrid chat application** — kombinasi kesederhanaan WhatsApp + fitur komunitas Discord, dengan identitas berbasis **username** (bukan nomor HP).

## Struktur Repository

```
disapp/
├── frontend/          # Web prototype (HTML/JS + Tailwind)
├── backend/           # Node.js API + Socket.io + WebRTC signaling
└── README.md
```

## Quick Start

### Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```
→ `http://localhost:3000`  
Demo user: `alex_rivera` / `password123`

### Frontend
```bash
cd frontend
# buka index.html di browser, atau
python3 -m http.server 8080
```

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend (MVP web) | HTML, Tailwind, Vanilla JS |
| Frontend (Production) | Flutter (iOS, Android, Web) |
| Backend | Node.js, Express, Socket.io |
| Auth | JWT (Access + Refresh) |
| Realtime | WebSocket (pesan, typing, presence, reaction) |
| Voice/Video | WebRTC (signaling via Socket.io, SFU nanti) |

## Fitur MVP

- ✅ Registrasi & login dengan username
- ✅ Chat pribadi & grup
- ✅ Server & channel (Discord-style)
- ✅ Voice / Video call + screen share (signaling)
- ✅ Sticker store (freemium)
- ✅ Tema dark (Obsidian Flux) & light

## Roadmap

1. **Sprint 1–2**: Auth + Core messaging
2. **Sprint 3**: Servers & channels
3. **Sprint 4**: Stickers & reactions
4. **Sprint 5**: WebRTC voice/video/screen share
5. Production: PostgreSQL + Redis + Flutter app

---

Built with ❤️ for communities.

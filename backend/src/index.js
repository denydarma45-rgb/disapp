/**
 * Disapp Backend
 * REST API + Socket.io (WebSocket) + WebRTC signaling
 * Sesuai kontrak API di PRD
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const { initSocket } = require('./socket');

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const contactsRoutes = require('./routes/contacts');
const conversationsRoutes = require('./routes/conversations');
const serversRoutes = require('./routes/servers');
const callsRoutes = require('./routes/calls');
const stickersRoutes = require('./routes/stickers');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: config.corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
app.set('io', io);
initSocket(io);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too Many Requests', message: 'Rate limit exceeded (100/min)' },
});
app.use('/api/', limiter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'disapp-api', time: new Date().toISOString() });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/contacts', contactsRoutes);
app.use('/api/v1/conversations', conversationsRoutes);
app.use('/api/v1/servers', serversRoutes);
app.use('/api/v1/calls', callsRoutes);
app.use('/api/v1/stickers', stickersRoutes);
app.use('/api/v1', stickersRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

server.listen(config.port, () => {
  console.log(`Disapp Backend running on http://localhost:${config.port}`);
  console.log(`Demo user: alex_rivera / password123`);
});

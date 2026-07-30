const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../models/store');
const { authenticate } = require('../middleware/auth');
const config = require('../config');

const router = express.Router();

router.get('/token', authenticate, (req, res) => {
  const roomId = req.query.roomId || uuidv4();
  const userId = req.query.userId || req.user.id;
  if (userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  if (!store.calls.has(roomId)) {
    store.calls.set(roomId, { roomId, createdBy: req.user.id, participants: [req.user.id], startedAt: new Date().toISOString(), status: 'active' });
  } else {
    const call = store.calls.get(roomId);
    if (!call.participants.includes(req.user.id)) call.participants.push(req.user.id);
  }
  const token = {
    roomId, userId: req.user.id, username: req.user.username, provider: config.webrtcProvider,
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }],
    accessToken: `mock-webrtc-${roomId}-${req.user.id}-${Date.now()}`, expiresIn: 3600,
  };
  const io = req.app.get('io');
  if (io) {
    io.to(`room:${roomId}`).emit('call_participant_joined', {
      event: 'call_participant_joined',
      data: { roomId, userId: req.user.id, username: req.user.username },
    });
  }
  res.json(token);
});

router.post('/:roomId/end', authenticate, (req, res) => {
  const call = store.calls.get(req.params.roomId);
  if (!call) return res.status(404).json({ error: 'Not Found', message: 'Call not found' });
  call.status = 'ended'; call.endedAt = new Date().toISOString(); call.endedBy = req.user.id;
  const io = req.app.get('io');
  if (io) {
    io.to(`room:${req.params.roomId}`).emit('call_ended', {
      event: 'call_ended', data: { roomId: req.params.roomId, endedBy: req.user.id },
    });
  }
  res.json({ message: 'Call ended', call });
});

module.exports = router;

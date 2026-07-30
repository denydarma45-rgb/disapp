const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../models/store');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const list = [];
  for (const [id, conv] of store.conversations) {
    if (conv.memberIds.includes(req.user.id)) {
      const msgs = store.messages.get(id) || [];
      const lastMsg = msgs[msgs.length - 1] || null;
      list.push({
        id: conv.id, name: conv.name, type: conv.type, memberIds: conv.memberIds,
        lastMessage: lastMsg ? { id: lastMsg.id, content: lastMsg.content, senderId: lastMsg.senderId, createdAt: lastMsg.createdAt } : null,
        updatedAt: conv.updatedAt,
      });
    }
  }
  list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json({ conversations: list });
});

router.post('/', authenticate, (req, res) => {
  const { name, type = 'group', memberIds = [] } = req.body;
  if (!['group', 'dm', 'server'].includes(type)) {
    return res.status(400).json({ error: 'Bad Request', message: 'type must be group, dm, or server' });
  }
  const members = new Set([req.user.id, ...memberIds]);
  if (members.size < 2 && type !== 'server') {
    return res.status(400).json({ error: 'Bad Request', message: 'At least 2 members required' });
  }
  const id = uuidv4();
  const now = new Date().toISOString();
  const conv = { id, name: name || null, type, memberIds: [...members], createdBy: req.user.id, createdAt: now, updatedAt: now };
  store.conversations.set(id, conv);
  store.messages.set(id, []);
  res.status(201).json({ conversation: conv });
});

router.get('/:convId/messages', authenticate, (req, res) => {
  const conv = store.conversations.get(req.params.convId);
  if (!conv) return res.status(404).json({ error: 'Not Found' });
  if (!conv.memberIds.includes(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
  let msgs = store.messages.get(req.params.convId) || [];
  if (req.query.before) {
    const idx = msgs.findIndex((m) => m.id === req.query.before);
    if (idx > 0) msgs = msgs.slice(0, idx);
  }
  const page = msgs.slice(-limit);
  res.json({ messages: page, hasMore: msgs.length > limit });
});

router.post('/:convId/messages', authenticate, (req, res) => {
  const conv = store.conversations.get(req.params.convId);
  if (!conv) return res.status(404).json({ error: 'Not Found' });
  if (!conv.memberIds.includes(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
  const { content, type = 'text', stickerId } = req.body;
  if (!content && type === 'text') return res.status(400).json({ error: 'Bad Request', message: 'content is required' });
  const msg = {
    id: uuidv4(), conversationId: conv.id, senderId: req.user.id, senderUsername: req.user.username,
    content: content || '', type, stickerId: stickerId || null, reactions: [], createdAt: new Date().toISOString(),
  };
  const msgs = store.messages.get(conv.id) || [];
  msgs.push(msg);
  store.messages.set(conv.id, msgs);
  conv.updatedAt = msg.createdAt;
  store.conversations.set(conv.id, conv);
  const io = req.app.get('io');
  if (io) {
    conv.memberIds.forEach((uid) => {
      io.to(`user:${uid}`).emit('message_new', { event: 'message_new', data: msg });
    });
  }
  res.status(201).json({ message: msg });
});

module.exports = router;

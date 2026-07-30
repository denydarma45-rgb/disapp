const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../models/store');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const list = [];
  for (const [id, server] of store.servers) {
    if (server.memberIds.includes(req.user.id)) {
      list.push({
        id: server.id, name: server.name, description: server.description, iconUrl: server.iconUrl,
        ownerId: server.ownerId, memberCount: server.memberIds.length, createdAt: server.createdAt,
      });
    }
  }
  res.json({ servers: list });
});

router.post('/', authenticate, (req, res) => {
  const { name, description = '', iconUrl = null } = req.body;
  if (!name || name.length < 2 || name.length > 50) {
    return res.status(400).json({ error: 'Bad Request', message: 'name must be 2-50 characters' });
  }
  const id = uuidv4();
  const now = new Date().toISOString();
  const server = {
    id, name, description, iconUrl, ownerId: req.user.id,
    memberIds: [req.user.id], roles: { [req.user.id]: 'admin' }, createdAt: now,
  };
  store.servers.set(id, server);
  const defaultChannels = [
    { id: uuidv4(), serverId: id, name: 'general', type: 'text', createdAt: now },
    { id: uuidv4(), serverId: id, name: 'voice', type: 'voice', createdAt: now },
  ];
  store.channels.set(id, defaultChannels);
  res.status(201).json({ server, channels: defaultChannels });
});

router.get('/:serverId/channels', authenticate, (req, res) => {
  const server = store.servers.get(req.params.serverId);
  if (!server) return res.status(404).json({ error: 'Not Found' });
  if (!server.memberIds.includes(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
  const channels = store.channels.get(req.params.serverId) || [];
  res.json({ channels });
});

router.post('/:serverId/channels', authenticate, (req, res) => {
  const server = store.servers.get(req.params.serverId);
  if (!server) return res.status(404).json({ error: 'Not Found' });
  if (!server.memberIds.includes(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
  if (server.roles[req.user.id] !== 'admin') {
    return res.status(403).json({ error: 'Forbidden', message: 'Only admin can create channels' });
  }
  const { name, type = 'text' } = req.body;
  if (!name || !['text', 'voice'].includes(type)) {
    return res.status(400).json({ error: 'Bad Request', message: 'name and type (text|voice) required' });
  }
  const channels = store.channels.get(req.params.serverId) || [];
  if (channels.length >= 50) return res.status(400).json({ error: 'Bad Request', message: 'Max 50 channels per server' });
  const channel = { id: uuidv4(), serverId: req.params.serverId, name, type, createdAt: new Date().toISOString() };
  channels.push(channel);
  store.channels.set(req.params.serverId, channels);
  res.status(201).json({ channel });
});

module.exports = router;

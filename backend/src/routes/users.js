const express = require('express');
const store = require('../models/store');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/me', authenticate, (req, res) => {
  const user = store.users.get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Not Found' });
  const presence = store.presence.get(user.id) || { status: 'offline' };
  res.json({
    id: user.id, username: user.username, email: user.email,
    bio: user.bio, avatarUrl: user.avatarUrl, theme: user.theme,
    presence: presence.status, createdAt: user.createdAt,
  });
});

router.patch('/me', authenticate, (req, res) => {
  const user = store.users.get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Not Found' });
  const { bio, avatarUrl, theme } = req.body;
  if (typeof bio === 'string') user.bio = bio.slice(0, 200);
  if (typeof avatarUrl === 'string') user.avatarUrl = avatarUrl;
  if (typeof theme === 'string' && ['obsidian_flux', 'disapp_system'].includes(theme)) {
    user.theme = theme;
  }
  store.users.set(user.id, user);
  res.json({ id: user.id, username: user.username, email: user.email, bio: user.bio, avatarUrl: user.avatarUrl, theme: user.theme });
});

router.get('/:username', authenticate, (req, res) => {
  const username = req.params.username.toLowerCase();
  const userId = store.usersByUsername.get(username);
  if (!userId) return res.status(404).json({ error: 'Not Found', message: 'User not found' });
  const user = store.users.get(userId);
  const presence = store.presence.get(userId) || { status: 'offline' };
  res.json({ id: user.id, username: user.username, bio: user.bio, avatarUrl: user.avatarUrl, presence: presence.status });
});

module.exports = router;

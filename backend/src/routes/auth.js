const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const store = require('../models/store');
const { signAccessToken, signRefreshToken, verifyToken } = require('../utils/jwt');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Bad Request', message: 'username, email, and password are required' });
    }
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ error: 'Bad Request', message: 'Username must be 3-20 characters (alphanumeric and underscore only)' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Bad Request', message: 'Password must be at least 8 characters' });
    }
    if (store.usersByUsername.has(username.toLowerCase())) {
      return res.status(409).json({ error: 'Conflict', message: 'Username already taken' });
    }
    if (store.usersByEmail.has(email.toLowerCase())) {
      return res.status(409).json({ error: 'Conflict', message: 'Email already registered' });
    }
    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 12);
    const user = {
      id, username: username.toLowerCase(), email: email.toLowerCase(), passwordHash,
      bio: '', avatarUrl: null, theme: 'obsidian_flux', createdAt: new Date().toISOString(),
    };
    store.users.set(id, user);
    store.usersByUsername.set(user.username, id);
    store.usersByEmail.set(user.email, id);
    store.presence.set(id, { status: 'offline', lastSeen: new Date().toISOString() });
    store.contacts.set(id, new Set());
    const accessToken = signAccessToken({ sub: id, username: user.username });
    const refreshToken = signRefreshToken({ sub: id });
    store.refreshTokens.set(refreshToken, id);
    res.status(201).json({
      user: { id: user.id, username: user.username, email: user.email, bio: user.bio, avatarUrl: user.avatarUrl, theme: user.theme },
      accessToken, refreshToken,
    });
  } catch (err) {
    console.error('[auth/register]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Bad Request', message: 'username and password are required' });
    }
    let userId = store.usersByUsername.get(username.toLowerCase());
    if (!userId) userId = store.usersByEmail.get(username.toLowerCase());
    if (!userId) return res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
    const user = store.users.get(userId);
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
    const accessToken = signAccessToken({ sub: user.id, username: user.username });
    const refreshToken = signRefreshToken({ sub: user.id });
    store.refreshTokens.set(refreshToken, user.id);
    store.presence.set(user.id, { status: 'online', lastSeen: new Date().toISOString() });
    res.json({
      user: { id: user.id, username: user.username, email: user.email, bio: user.bio, avatarUrl: user.avatarUrl, theme: user.theme },
      accessToken, refreshToken,
    });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Bad Request', message: 'refreshToken is required' });
    if (!store.refreshTokens.has(refreshToken)) return res.status(401).json({ error: 'Unauthorized', message: 'Invalid refresh token' });
    const payload = verifyToken(refreshToken);
    const user = store.users.get(payload.sub);
    if (!user) return res.status(401).json({ error: 'Unauthorized', message: 'User not found' });
    store.refreshTokens.delete(refreshToken);
    const newRefresh = signRefreshToken({ sub: user.id });
    store.refreshTokens.set(newRefresh, user.id);
    const accessToken = signAccessToken({ sub: user.id, username: user.username });
    res.json({ accessToken, refreshToken: newRefresh });
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired refresh token' });
  }
});

router.post('/logout', authenticate, (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) store.refreshTokens.delete(refreshToken);
  store.presence.set(req.user.id, { status: 'offline', lastSeen: new Date().toISOString() });
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;

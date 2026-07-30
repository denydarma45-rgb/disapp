const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const PACKAGES = [
  { id: 'pkg_free_emoji', name: 'Basic Emoji Pack', price: 0, premium: false,
    stickers: [{ id: 's1', name: 'fire', url: '/stickers/fire.gif' }, { id: 's2', name: 'heart', url: '/stickers/heart.gif' }] },
  { id: 'pkg_gaming_pro', name: 'Gaming Pro Pack', price: 29900, premium: true,
    stickers: [{ id: 's10', name: 'gg', url: '/stickers/gg.gif' }, { id: 's11', name: 'clutch', url: '/stickers/clutch.gif' }] },
];

router.get('/packages', authenticate, (req, res) => {
  res.json({ packages: PACKAGES });
});

router.post('/purchase', authenticate, (req, res) => {
  const { packageId } = req.body;
  const pkg = PACKAGES.find((p) => p.id === packageId);
  if (!pkg) return res.status(404).json({ error: 'Not Found', message: 'Package not found' });
  if (!pkg.premium) return res.status(400).json({ error: 'Bad Request', message: 'Package is free' });
  res.json({ message: 'Purchase successful (mock)', package: pkg, grantedAt: new Date().toISOString() });
});

router.get('/themes', authenticate, (req, res) => {
  res.json({ themes: [
    { id: 'obsidian_flux', name: 'Obsidian Flux', mode: 'dark' },
    { id: 'disapp_system', name: 'Disapp System', mode: 'light' },
  ]});
});

module.exports = router;

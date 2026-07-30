const express = require('express');
const store = require('../models/store');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const contactIds = store.contacts.get(req.user.id) || new Set();
  const list = [];
  for (const cid of contactIds) {
    const user = store.users.get(cid);
    if (!user) continue;
    const presence = store.presence.get(cid) || { status: 'offline' };
    list.push({ id: user.id, username: user.username, bio: user.bio, avatarUrl: user.avatarUrl, presence: presence.status });
  }
  res.json({ contacts: list });
});

router.post('/', authenticate, (req, res) => {
  const { targetUsername } = req.body;
  if (!targetUsername) return res.status(400).json({ error: 'Bad Request', message: 'targetUsername is required' });
  const targetId = store.usersByUsername.get(targetUsername.toLowerCase());
  if (!targetId) return res.status(404).json({ error: 'Not Found', message: 'User not found' });
  if (targetId === req.user.id) return res.status(400).json({ error: 'Bad Request', message: 'Cannot add yourself' });
  let myContacts = store.contacts.get(req.user.id);
  if (!myContacts) { myContacts = new Set(); store.contacts.set(req.user.id, myContacts); }
  if (myContacts.has(targetId)) return res.status(409).json({ error: 'Conflict', message: 'Already in contacts' });
  myContacts.add(targetId);
  let theirContacts = store.contacts.get(targetId);
  if (!theirContacts) { theirContacts = new Set(); store.contacts.set(targetId, theirContacts); }
  theirContacts.add(req.user.id);
  const user = store.users.get(targetId);
  res.status(201).json({ contact: { id: user.id, username: user.username, bio: user.bio, avatarUrl: user.avatarUrl } });
});

router.delete('/:contactId', authenticate, (req, res) => {
  const contactId = req.params.contactId;
  const myContacts = store.contacts.get(req.user.id);
  if (!myContacts || !myContacts.has(contactId)) return res.status(404).json({ error: 'Not Found', message: 'Contact not found' });
  myContacts.delete(contactId);
  const theirContacts = store.contacts.get(contactId);
  if (theirContacts) theirContacts.delete(req.user.id);
  res.json({ message: 'Contact removed' });
});

module.exports = router;

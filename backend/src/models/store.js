/**
 * In-memory store for MVP / development.
 * Ganti dengan PostgreSQL + Redis di production.
 */

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const store = {
  users: new Map(),
  usersByUsername: new Map(),
  usersByEmail: new Map(),
  refreshTokens: new Map(),
  contacts: new Map(),
  conversations: new Map(),
  messages: new Map(),
  servers: new Map(),
  channels: new Map(),
  presence: new Map(),
  calls: new Map(),
};

(async () => {
  const id = uuidv4();
  const hash = await bcrypt.hash('password123', 12);
  const user = {
    id,
    username: 'alex_rivera',
    email: 'alex@disapp.app',
    passwordHash: hash,
    bio: 'Building the future of chat',
    avatarUrl: null,
    theme: 'obsidian_flux',
    createdAt: new Date().toISOString(),
  };
  store.users.set(id, user);
  store.usersByUsername.set('alex_rivera', id);
  store.usersByEmail.set('alex@disapp.app', id);
  store.presence.set(id, { status: 'online', lastSeen: new Date().toISOString() });
  console.log('[store] Seeded demo user: alex_rivera / password123');
})();

module.exports = store;

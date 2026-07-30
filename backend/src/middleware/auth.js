const { verifyToken } = require('../utils/jwt');
const store = require('../models/store');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Missing or invalid Authorization header' });
  }

  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    const user = store.users.get(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User not found' });
    }
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }
}

module.exports = { authenticate };

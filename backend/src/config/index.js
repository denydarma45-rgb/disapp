require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'disapp-dev-secret-change-me-in-production-32chars',
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  },
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:8080').split(','),
  webrtcProvider: process.env.WEBRTC_PROVIDER || 'janus',
};

/**
 * WebSocket (Socket.io) real-time layer
 * Events: message_new, reaction_add, presence_update, typing_indicator, webrtc_signal
 */

const { verifyToken } = require('../utils/jwt');
const store = require('../models/store');
const { v4: uuidv4 } = require('uuid');

function initSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = verifyToken(token);
      const user = store.users.get(payload.sub);
      if (!user) return next(new Error('User not found'));
      socket.user = { id: user.id, username: user.username };
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    console.log(`[socket] Connected: ${socket.user.username}`);
    socket.join(`user:${userId}`);

    store.presence.set(userId, { status: 'online', lastSeen: new Date().toISOString() });
    socket.broadcast.emit('presence_update', {
      event: 'presence_update',
      data: { userId, status: 'online', username: socket.user.username },
    });

    socket.on('typing_start', ({ conversationId }) => {
      if (!conversationId) return;
      const conv = store.conversations.get(conversationId);
      if (!conv || !conv.memberIds.includes(userId)) return;
      conv.memberIds.forEach((uid) => {
        if (uid !== userId) {
          io.to(`user:${uid}`).emit('typing_indicator', {
            event: 'typing_indicator',
            data: { conversationId, userId, username: socket.user.username, isTyping: true },
          });
        }
      });
    });

    socket.on('typing_stop', ({ conversationId }) => {
      if (!conversationId) return;
      const conv = store.conversations.get(conversationId);
      if (!conv) return;
      conv.memberIds.forEach((uid) => {
        if (uid !== userId) {
          io.to(`user:${uid}`).emit('typing_indicator', {
            event: 'typing_indicator',
            data: { conversationId, userId, username: socket.user.username, isTyping: false },
          });
        }
      });
    });

    socket.on('message_send', (payload, ack) => {
      try {
        const { conversationId, content, type = 'text', stickerId } = payload || {};
        const conv = store.conversations.get(conversationId);
        if (!conv || !conv.memberIds.includes(userId)) {
          if (typeof ack === 'function') ack({ error: 'Forbidden' });
          return;
        }
        const msg = {
          id: uuidv4(),
          conversationId,
          senderId: userId,
          senderUsername: socket.user.username,
          content: content || '',
          type,
          stickerId: stickerId || null,
          reactions: [],
          createdAt: new Date().toISOString(),
        };
        const msgs = store.messages.get(conversationId) || [];
        msgs.push(msg);
        store.messages.set(conversationId, msgs);
        conv.updatedAt = msg.createdAt;
        store.conversations.set(conversationId, conv);
        conv.memberIds.forEach((uid) => {
          io.to(`user:${uid}`).emit('message_new', { event: 'message_new', data: msg });
        });
        if (typeof ack === 'function') ack({ success: true, message: msg });
      } catch (err) {
        console.error('[socket message_send]', err);
        if (typeof ack === 'function') ack({ error: 'Internal error' });
      }
    });

    socket.on('reaction_add', (payload) => {
      const { messageId, conversationId, reactionType } = payload || {};
      if (!messageId || !conversationId || !reactionType) return;
      const msgs = store.messages.get(conversationId);
      if (!msgs) return;
      const msg = msgs.find((m) => m.id === messageId);
      if (!msg) return;
      const existing = msg.reactions.findIndex((r) => r.userId === userId && r.reactionType === reactionType);
      if (existing >= 0) msg.reactions.splice(existing, 1);
      else msg.reactions.push({ userId, username: socket.user.username, reactionType, timestamp: Date.now() });
      const conv = store.conversations.get(conversationId);
      if (!conv) return;
      const eventPayload = {
        event: 'reaction_add',
        data: { message_id: messageId, conversation_id: conversationId, user_id: userId, reaction_type: reactionType, reactions: msg.reactions, timestamp: Date.now() },
      };
      conv.memberIds.forEach((uid) => io.to(`user:${uid}`).emit('reaction_add', eventPayload));
    });

    socket.on('call_join', ({ roomId }) => {
      if (!roomId) return;
      socket.join(`room:${roomId}`);
      socket.to(`room:${roomId}`).emit('call_participant_joined', {
        event: 'call_participant_joined',
        data: { roomId, userId, username: socket.user.username },
      });
    });

    socket.on('webrtc_signal', ({ roomId, targetUserId, signal }) => {
      if (!roomId || !signal) return;
      if (targetUserId) {
        io.to(`user:${targetUserId}`).emit('webrtc_signal', {
          event: 'webrtc_signal',
          data: { roomId, fromUserId: userId, signal },
        });
      } else {
        socket.to(`room:${roomId}`).emit('webrtc_signal', {
          event: 'webrtc_signal',
          data: { roomId, fromUserId: userId, signal },
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[socket] Disconnected: ${socket.user.username}`);
      store.presence.set(userId, { status: 'offline', lastSeen: new Date().toISOString() });
      socket.broadcast.emit('presence_update', {
        event: 'presence_update',
        data: { userId, status: 'offline', username: socket.user.username },
      });
    });
  });

  console.log('[socket] Socket.io initialized');
}

module.exports = { initSocket };

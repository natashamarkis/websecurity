import express from 'express';
import db from '../database/index.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Get all conversations
router.get('/', authenticateUser, (req, res) => {
  db.all(
    `SELECT DISTINCT
       CASE
         WHEN from_user_id = ? THEN to_user_id
         ELSE from_user_id
       END as user_id,
       users.username,
       users.avatar,
       MAX(messages.created_at) as last_message_time
     FROM messages
     JOIN users ON users.id = CASE
       WHEN messages.from_user_id = ? THEN messages.to_user_id
       ELSE messages.from_user_id
     END
     WHERE from_user_id = ? OR to_user_id = ?
     GROUP BY user_id
     ORDER BY last_message_time DESC`,
    [req.user.id, req.user.id, req.user.id, req.user.id],
    (err, conversations) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch conversations' });
      }

      res.json({ conversations });
    }
  );
});

// Get messages with specific user
router.get('/:userId', authenticateUser, (req, res) => {
  const otherUserId = req.params.userId;

  db.all(
    `SELECT messages.*,
       sender.username as sender_username,
       sender.avatar as sender_avatar
     FROM messages
     JOIN users as sender ON messages.from_user_id = sender.id
     WHERE (from_user_id = ? AND to_user_id = ?)
        OR (from_user_id = ? AND to_user_id = ?)
     ORDER BY created_at ASC`,
    [req.user.id, otherUserId, otherUserId, req.user.id],
    (err, messages) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch messages' });
      }

      res.json({ messages });
    }
  );
});

// Send message
router.post('/', authenticateUser, (req, res) => {
  const { toUserId, text } = req.body;

  if (!toUserId || !text) {
    return res.status(400).json({ error: 'Recipient and text required' });
  }

  db.run(
    'INSERT INTO messages (from_user_id, to_user_id, text) VALUES (?, ?, ?)',
    [req.user.id, toUserId, text],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to send message' });
      }

      res.status(201).json({
        message: 'Message sent',
        messageId: this.lastID
      });
    }
  );
});

export default router;

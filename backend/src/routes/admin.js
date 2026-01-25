import express from 'express';
import db from '../database/index.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';
import { seedData } from '../database/seed.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateUser);
router.use(requireAdmin);

// Get all users
router.get('/users', (req, res) => {
  db.all(
    'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC',
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch users' });
      }

      res.json({ users });
    }
  );
});

// Get all sessions
router.get('/sessions', (req, res) => {
  db.all(
    `SELECT sessions.*, users.username
     FROM sessions
     JOIN users ON sessions.user_id = users.id
     ORDER BY sessions.last_active DESC`,
    (err, sessions) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch sessions' });
      }

      res.json({ sessions });
    }
  );
});

// Get demo logs
router.get('/logs', (req, res) => {
  const { type, limit = 50 } = req.query;

  let query = 'SELECT * FROM demo_logs ORDER BY created_at DESC LIMIT ?';
  let params = [parseInt(limit)];

  if (type) {
    query = 'SELECT * FROM demo_logs WHERE type = ? ORDER BY created_at DESC LIMIT ?';
    params = [type, parseInt(limit)];
  }

  db.all(query, params, (err, logs) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch logs' });
    }

    res.json({ logs });
  });
});

// Add demo log entry
router.post('/logs', (req, res) => {
  const { type, description, payload } = req.body;

  db.run(
    'INSERT INTO demo_logs (type, description, payload) VALUES (?, ?, ?)',
    [type, description, payload],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to add log' });
      }

      res.status(201).json({
        message: 'Log added',
        logId: this.lastID
      });
    }
  );
});

// Clear demo logs
router.delete('/logs', (req, res) => {
  db.run('DELETE FROM demo_logs', (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to clear logs' });
    }

    res.json({ message: 'Logs cleared' });
  });
});

// Reset demo data
router.post('/reset-demo', async (req, res) => {
  try {
    // Clear all data
    db.run('DELETE FROM comments');
    db.run('DELETE FROM posts');
    db.run('DELETE FROM messages');
    db.run('DELETE FROM sessions');
    db.run('DELETE FROM users');
    db.run('DELETE FROM demo_logs');

    // Re-seed
    await seedData(db);

    res.json({ message: 'Demo data reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset demo data' });
  }
});

// Get statistics
router.get('/stats', (req, res) => {
  const stats = {};

  db.get('SELECT COUNT(*) as count FROM users', (err, result) => {
    stats.users = result?.count || 0;

    db.get('SELECT COUNT(*) as count FROM posts', (err, result) => {
      stats.posts = result?.count || 0;

      db.get('SELECT COUNT(*) as count FROM comments', (err, result) => {
        stats.comments = result?.count || 0;

        db.get('SELECT COUNT(*) as count FROM sessions', (err, result) => {
          stats.activeSessions = result?.count || 0;

          db.get('SELECT COUNT(*) as count FROM demo_logs', (err, result) => {
            stats.demoLogs = result?.count || 0;

            res.json({ stats });
          });
        });
      });
    });
  });
});

export default router;

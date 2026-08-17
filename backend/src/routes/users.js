import express from 'express';
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'path';
import db from '../database/index.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Get user profile
router.get('/:id', (req, res) => {
  db.get(
    'SELECT id, username, email, bio, avatar, role, created_at FROM users WHERE id = ?',
    [req.params.id],
    (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get user's posts count
      db.get(
        'SELECT COUNT(*) as count FROM posts WHERE user_id = ?',
        [req.params.id],
        (err, result) => {
          user.postsCount = result ? result.count : 0;
          res.json({ user });
        }
      );
    }
  );
});

// Update user profile (VULNERABLE - NO CSRF PROTECTION)
router.put('/:id', authenticateUser, (req, res) => {
  const { email, bio } = req.body;
  const userId = req.params.id;

  if (parseInt(userId) !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized' });
  }

  db.run(
    'UPDATE users SET email = ?, bio = ? WHERE id = ?',
    [email, bio, userId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to update profile' });
      }

      res.json({ message: 'Profile updated' });
    }
  );
});

// Upload avatar
router.post('/:id/avatar', authenticateUser, upload.single('avatar'), (req, res) => {
  const userId = req.params.id;

  if (parseInt(userId) !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const avatarPath = `/uploads/${req.file.filename}`;

  db.run(
    'UPDATE users SET avatar = ? WHERE id = ?',
    [avatarPath, userId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to update avatar' });
      }

      res.json({ message: 'Avatar updated', avatar: avatarPath });
    }
  );
});

// Change password (VULNERABLE - sessions not invalidated)
router.post('/:id/change-password', authenticateUser, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.params.id;

  if (parseInt(userId) !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  db.get('SELECT password FROM users WHERE id = ?', [userId], async (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid current password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    db.run(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to change password' });
        }

        // VULNERABILITY: Not invalidating old sessions!
        res.json({ message: 'Password changed successfully' });
      }
    );
  });
});

// Delete account (VULNERABLE - NO CSRF PROTECTION)
router.delete('/:id', authenticateUser, (req, res) => {
  const userId = req.params.id;

  if (parseInt(userId) !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized' });
  }

  db.run('DELETE FROM users WHERE id = ?', [userId], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete account' });
    }

    // Clean up related data
    db.run('DELETE FROM posts WHERE user_id = ?', [userId]);
    db.run('DELETE FROM comments WHERE user_id = ?', [userId]);
    db.run('DELETE FROM sessions WHERE user_id = ?', [userId]);
    db.run('DELETE FROM messages WHERE from_user_id = ? OR to_user_id = ?', [userId, userId]);

    res.clearCookie('session_token');
    res.json({ message: 'Account deleted' });
  });
});

export default router;

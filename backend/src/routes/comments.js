import express from 'express';
import db from '../database/index.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Add comment (VULNERABLE - NO XSS PROTECTION)
router.post('/', authenticateUser, (req, res) => {
  const { postId, text } = req.body;

  if (!postId || !text) {
    return res.status(400).json({ error: 'Post ID and text required' });
  }

  // No sanitization - vulnerable to XSS!
  db.run(
    'INSERT INTO comments (post_id, user_id, text) VALUES (?, ?, ?)',
    [postId, req.user.id, text],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to add comment' });
      }

      res.status(201).json({
        message: 'Comment added',
        commentId: this.lastID
      });
    }
  );
});

// Delete comment (VULNERABLE - NO CSRF PROTECTION)
router.delete('/:id', authenticateUser, (req, res) => {
  const commentId = req.params.id;

  db.get('SELECT * FROM comments WHERE id = ?', [commentId], (err, comment) => {
    if (err || !comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    db.run('DELETE FROM comments WHERE id = ?', [commentId], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete comment' });
      }

      res.json({ message: 'Comment deleted' });
    });
  });
});

export default router;

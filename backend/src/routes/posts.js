import express from 'express';
import db from '../database/index.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Get all posts (with search - VULNERABLE TO XSS)
router.get('/', (req, res) => {
  const { q } = req.query;

  let query = `
    SELECT posts.*, users.username, users.avatar
    FROM posts
    JOIN users ON posts.user_id = users.id
    ORDER BY posts.created_at DESC
  `;
  let params = [];

  if (q) {
    query = `
      SELECT posts.*, users.username, users.avatar
      FROM posts
      JOIN users ON posts.user_id = users.id
      WHERE posts.title LIKE ? OR posts.content LIKE ?
      ORDER BY posts.created_at DESC
    `;
    params = [`%${q}%`, `%${q}%`];
  }

  db.all(query, params, (err, posts) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch posts' });
    }
    res.json({ posts, searchQuery: q });
  });
});

// Get single post
router.get('/:id', (req, res) => {
  db.get(
    `SELECT posts.*, users.username, users.avatar
     FROM posts
     JOIN users ON posts.user_id = users.id
     WHERE posts.id = ?`,
    [req.params.id],
    (err, post) => {
      if (err || !post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Get comments for this post
      db.all(
        `SELECT comments.*, users.username, users.avatar
         FROM comments
         JOIN users ON comments.user_id = users.id
         WHERE comments.post_id = ?
         ORDER BY comments.created_at ASC`,
        [req.params.id],
        (err, comments) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to fetch comments' });
          }

          res.json({ post, comments });
        }
      );
    }
  );
});

// Create post (requires auth)
router.post('/', authenticateUser, (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content required' });
  }

  db.run(
    'INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)',
    [req.user.id, title, content],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create post' });
      }

      res.status(201).json({
        message: 'Post created',
        postId: this.lastID
      });
    }
  );
});

// Delete post (VULNERABLE - NO CSRF PROTECTION)
router.delete('/:id', authenticateUser, (req, res) => {
  const postId = req.params.id;

  // Check if user owns the post or is admin
  db.get('SELECT * FROM posts WHERE id = ?', [postId], (err, post) => {
    if (err || !post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    db.run('DELETE FROM posts WHERE id = ?', [postId], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete post' });
      }

      // Also delete comments
      db.run('DELETE FROM comments WHERE post_id = ?', [postId]);

      res.json({ message: 'Post deleted' });
    });
  });
});

export default router;

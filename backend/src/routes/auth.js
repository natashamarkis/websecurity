import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import db from '../database/index.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Username already exists' });
          }
          return res.status(500).json({ error: 'Registration failed' });
        }

        res.status(201).json({
          message: 'User registered successfully',
          userId: this.lastID
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login (with httpOnly cookie)
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create session
    const token = crypto.randomBytes(32).toString('hex');

    db.run(
      'INSERT INTO sessions (user_id, token) VALUES (?, ?)',
      [user.id, token],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Session creation failed' });
        }

        // Set httpOnly cookie
        res.cookie('session_token', token, {
          httpOnly: true,
          secure: false, // set to true in production with HTTPS
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
          message: 'Login successful',
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          }
        });
      }
    );
  });
});

// Logout
router.post('/logout', (req, res) => {
  const token = req.cookies.session_token;

  if (token) {
    db.run('DELETE FROM sessions WHERE token = ?', [token]);
  }

  res.clearCookie('session_token');
  res.json({ message: 'Logged out successfully' });
});

// Get current user
router.get('/me', (req, res) => {
  const token = req.cookies.session_token;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  db.get(
    `SELECT users.id, users.username, users.email, users.role, users.bio, users.avatar
     FROM users
     JOIN sessions ON users.id = sessions.user_id
     WHERE sessions.token = ?`,
    [token],
    (err, user) => {
      if (err || !user) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      res.json({ user });
    }
  );
});

export default router;

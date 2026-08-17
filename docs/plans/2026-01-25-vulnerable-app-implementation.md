# Vulnerable Web App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full-stack vulnerable web application demonstrating 9 frontend security vulnerabilities with interactive admin demo panel for tech talk presentation.

**Architecture:** React + TypeScript frontend with Ant Design, Node.js + Express backend with SQLite database. Intentionally vulnerable code for educational demonstration with admin panel to showcase exploits interactively.

**Tech Stack:**
- Frontend: React 18, TypeScript, Vite, Ant Design, React Router, Axios
- Backend: Node.js, Express, SQLite3, bcrypt, cookie-parser, multer, lodash (vulnerable version)

---

## Task 1: Backend Project Initialization

**Files:**
- Create: `backend/package.json`
- Create: `backend/.gitignore`
- Create: `backend/src/server.js`

**Step 1: Create backend directory and initialize npm**

```bash
mkdir backend
cd backend
npm init -y
```

Expected: `package.json` created

**Step 2: Install backend dependencies**

```bash
npm install express sqlite3 bcrypt cookie-parser multer cors lodash@4.17.11
npm install -D nodemon
```

Expected: Dependencies installed, `node_modules/` and `package-lock.json` created

**Step 3: Create .gitignore**

Create `backend/.gitignore`:
```
node_modules/
database.sqlite
uploads/
.env
*.log
```

**Step 4: Update package.json scripts**

Modify `backend/package.json`:
```json
{
  "name": "vulnerable-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  }
}
```

**Step 5: Create basic Express server**

Create `backend/src/server.js`:
```javascript
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
```

**Step 6: Test server**

Run: `npm run dev`
Expected: "Backend server running on http://localhost:3000"

Open browser: http://localhost:3000/api/health
Expected: `{"status":"ok","message":"Server is running"}`

**Step 7: Commit backend initialization**

```bash
git add backend/
git commit -m "feat(backend): initialize Node.js project with Express"
```

---

## Task 2: Database Setup and Schema

**Files:**
- Create: `backend/src/database/schema.js`
- Create: `backend/src/database/seed.js`
- Create: `backend/src/database/index.js`

**Step 1: Create database directory structure**

```bash
mkdir -p backend/src/database
mkdir -p backend/uploads
```

**Step 2: Create database schema**

Create `backend/src/database/schema.js`:
```javascript
export const createTables = (db) => {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      password TEXT NOT NULL,
      bio TEXT,
      avatar TEXT,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Posts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Comments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER NOT NULL,
      to_user_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_user_id) REFERENCES users(id),
      FOREIGN KEY (to_user_id) REFERENCES users(id)
    )
  `);

  // Demo logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS demo_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      description TEXT,
      payload TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Database tables created');
};
```

**Step 3: Create database connection module**

Create `backend/src/database/index.js`:
```javascript
import sqlite3 from 'sqlite3';
import { createTables } from './schema.js';
import { seedData } from './seed.js';

const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Initialize database
export const initDatabase = async () => {
  createTables(db);
  await seedData(db);
};

export default db;
```

**Step 4: Create seed data**

Create `backend/src/database/seed.js`:
```javascript
import bcrypt from 'bcrypt';

export const seedData = async (db) => {
  // Check if data already exists
  db.get('SELECT COUNT(*) as count FROM users', async (err, row) => {
    if (row.count > 0) {
      console.log('ℹ️  Database already seeded');
      return;
    }

    console.log('🌱 Seeding database...');

    // Hash passwords
    const adminPass = await bcrypt.hash('admin123', 10);
    const alicePass = await bcrypt.hash('alice123', 10);
    const bobPass = await bcrypt.hash('bob123', 10);
    const attackerPass = await bcrypt.hash('hack123', 10);

    // Insert users
    const insertUser = db.prepare(
      'INSERT INTO users (username, email, password, bio, role) VALUES (?, ?, ?, ?, ?)'
    );

    insertUser.run('admin', 'admin@vulnerable.app', adminPass, 'System Administrator', 'admin');
    insertUser.run('alice', 'alice@example.com', alicePass, 'Software Developer 👩‍💻', 'user');
    insertUser.run('bob', 'bob@example.com', bobPass, 'Designer', 'user');
    insertUser.run('attacker', 'attacker@evil.com', attackerPass, 'Security Researcher', 'user');
    insertUser.finalize();

    // Insert posts
    const insertPost = db.prepare(
      'INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)'
    );

    insertPost.run(2, 'Welcome to the Platform!', 'This is my first post. Excited to be here!');
    insertPost.run(2, 'Web Security Best Practices', 'Always sanitize user input and use prepared statements...');
    insertPost.run(3, 'New Design Trends 2026', 'Check out these amazing UI patterns...');
    insertPost.run(2, 'My Favorite JavaScript Libraries', 'Here are some libraries I use daily...');
    insertPost.run(3, 'Typography in Web Design', 'Good typography makes a huge difference...');
    insertPost.run(2, 'Working Remotely Tips', 'How I stay productive while working from home...');
    insertPost.run(4, 'Check this out!', 'Interesting link: <a href="/api/redirect?url=http://evil.com">Click here</a>');
    insertPost.run(2, 'Database Optimization', 'Tips for making your queries faster...');
    insertPost.run(3, 'Color Theory Basics', 'Understanding color combinations...');
    insertPost.run(2, 'Testing Strategies', 'How I approach testing my applications...');
    insertPost.finalize();

    // Insert comments (some with XSS payloads)
    const insertComment = db.prepare(
      'INSERT INTO comments (post_id, user_id, text) VALUES (?, ?, ?)'
    );

    insertComment.run(1, 3, 'Great post! Welcome aboard!');
    insertComment.run(1, 4, 'Nice to meet you!');
    insertComment.run(2, 3, 'Very informative, thanks for sharing!');
    insertComment.run(2, 4, '<img src=x onerror=alert("XSS")>');
    insertComment.run(3, 2, 'Love these trends!');
    insertComment.run(4, 3, 'I use React and Vue mostly');
    insertComment.run(5, 2, 'Typography is underrated!');
    insertComment.run(6, 3, 'Great tips!');
    insertComment.run(1, 2, 'Thanks everyone!');
    insertComment.run(3, 4, '<script>console.log("Stored XSS")</script>');
    insertComment.finalize();

    // Insert messages
    const insertMessage = db.prepare(
      'INSERT INTO messages (from_user_id, to_user_id, text) VALUES (?, ?, ?)'
    );

    insertMessage.run(2, 3, 'Hey Bob, loved your design post!');
    insertMessage.run(3, 2, 'Thanks Alice! Glad you enjoyed it.');
    insertMessage.run(2, 3, 'Want to collaborate on a project?');
    insertMessage.run(3, 2, 'Sure! What do you have in mind?');
    insertMessage.run(1, 2, 'Welcome to the platform Alice!');
    insertMessage.finalize();

    console.log('✅ Database seeded successfully');
  });
};
```

**Step 5: Update server.js to initialize database**

Modify `backend/src/server.js`:
```javascript
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initDatabase } from './database/index.js';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Initialize database and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
});
```

**Step 6: Test database initialization**

Run: `npm run dev`
Expected:
- "Connected to SQLite database"
- "Database tables created"
- "Seeding database..."
- "Database seeded successfully"
- File `backend/database.sqlite` created

**Step 7: Commit database setup**

```bash
git add backend/
git commit -m "feat(backend): add SQLite database schema and seed data"
```

---

## Task 3: Authentication Routes (Vulnerable)

**Files:**
- Create: `backend/src/routes/auth.js`
- Create: `backend/src/middleware/auth.js`
- Modify: `backend/src/server.js`

**Step 1: Create authentication middleware**

Create `backend/src/middleware/auth.js`:
```javascript
import db from '../database/index.js';

export const authenticateUser = (req, res, next) => {
  const token = req.cookies.session_token;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  db.get(
    `SELECT users.* FROM users
     JOIN sessions ON users.id = sessions.user_id
     WHERE sessions.token = ?`,
    [token],
    (err, user) => {
      if (err || !user) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      // Update last_active
      db.run('UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE token = ?', [token]);

      req.user = user;
      next();
    }
  );
};

export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
```

**Step 2: Create authentication routes**

Create `backend/src/routes/auth.js`:
```javascript
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
```

**Step 3: Mount auth routes in server**

Modify `backend/src/server.js`:
```javascript
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initDatabase } from './database/index.js';
import authRoutes from './routes/auth.js';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Initialize database and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
});
```

**Step 4: Test authentication**

Run: `npm run dev`

Test with curl or Postman:
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"alice123"}' \
  -c cookies.txt

# Get current user
curl http://localhost:3000/api/auth/me -b cookies.txt
```

Expected: Login returns user object and sets cookie, /me returns user info

**Step 5: Commit authentication**

```bash
git add backend/
git commit -m "feat(backend): add authentication routes with httpOnly cookies"
```

---

## Task 4: Posts and Comments Routes (Vulnerable to XSS/CSRF)

**Files:**
- Create: `backend/src/routes/posts.js`
- Create: `backend/src/routes/comments.js`
- Modify: `backend/src/server.js`

**Step 1: Create posts routes**

Create `backend/src/routes/posts.js`:
```javascript
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
```

**Step 2: Create comments routes**

Create `backend/src/routes/comments.js`:
```javascript
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
```

**Step 3: Mount routes in server**

Modify `backend/src/server.js`:
```javascript
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initDatabase } from './database/index.js';
import authRoutes from './routes/auth.js';
import postsRoutes from './routes/posts.js';
import commentsRoutes from './routes/comments.js';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/comments', commentsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Initialize database and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
});
```

**Step 4: Test posts and comments**

```bash
# Get all posts
curl http://localhost:3000/api/posts

# Get single post with comments
curl http://localhost:3000/api/posts/1

# Search posts (test XSS vulnerability)
curl "http://localhost:3000/api/posts?q=<script>alert('xss')</script>"
```

Expected: Posts returned, search query reflected without sanitization

**Step 5: Commit posts and comments**

```bash
git add backend/
git commit -m "feat(backend): add posts and comments routes (vulnerable to XSS/CSRF)"
```

---

## Task 5: User Profile and Messages Routes

**Files:**
- Create: `backend/src/routes/users.js`
- Create: `backend/src/routes/messages.js`
- Modify: `backend/src/server.js`

**Step 1: Create users routes**

Create `backend/src/routes/users.js`:
```javascript
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
```

**Step 2: Create messages routes**

Create `backend/src/routes/messages.js`:
```javascript
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
```

**Step 3: Mount routes and serve uploads**

Modify `backend/src/server.js`:
```javascript
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initDatabase } from './database/index.js';
import authRoutes from './routes/auth.js';
import postsRoutes from './routes/posts.js';
import commentsRoutes from './routes/comments.js';
import usersRoutes from './routes/users.js';
import messagesRoutes from './routes/messages.js';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/messages', messagesRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Initialize database and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
});
```

**Step 4: Test user and messages endpoints**

```bash
# Get user profile
curl http://localhost:3000/api/users/2

# Get messages (need authentication)
curl http://localhost:3000/api/messages -b cookies.txt
```

Expected: User profile returned, messages returned for authenticated user

**Step 5: Commit users and messages**

```bash
git add backend/
git commit -m "feat(backend): add user profile and messages routes"
```

---

## Task 6: Vulnerable Endpoints (SSRF, Open Redirect, Prototype Pollution)

**Files:**
- Create: `backend/src/routes/vulnerable.js`
- Modify: `backend/src/server.js`

**Step 1: Create vulnerable endpoints**

Create `backend/src/routes/vulnerable.js`:
```javascript
import express from 'express';
import _ from 'lodash'; // Using vulnerable version 4.17.11
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Open Redirect (VULNERABLE)
router.get('/redirect', (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter required' });
  }

  // No validation - redirects to any URL!
  res.redirect(url);
});

// SSRF - URL Preview (VULNERABLE)
router.post('/preview', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL required' });
  }

  try {
    // VULNERABILITY: No validation, can request internal URLs!
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url);
    const content = await response.text();

    res.json({
      url,
      statusCode: response.status,
      preview: content.substring(0, 500) // First 500 chars
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch URL', details: error.message });
  }
});

// Prototype Pollution (VULNERABLE)
router.post('/settings/merge', authenticateUser, (req, res) => {
  const userSettings = {};

  // VULNERABILITY: Using vulnerable lodash merge with user input
  _.merge(userSettings, req.body);

  res.json({
    message: 'Settings merged',
    settings: userSettings
  });
});

// Data Exposure - Debug endpoint (VULNERABLE)
router.get('/debug/config', (req, res) => {
  // VULNERABILITY: Exposing sensitive configuration
  const config = {
    database: 'database.sqlite',
    jwtSecret: 'super-secret-key-123',
    apiKeys: {
      stripe: 'sk_test_123456789',
      aws: 'AKIAIOSFODNN7EXAMPLE'
    },
    nodeEnv: process.env.NODE_ENV || 'development',
    internalApis: [
      'http://localhost:3000/api/admin',
      'http://169.254.169.254/latest/meta-data'
    ]
  };

  res.json(config);
});

export default router;
```

**Step 2: Install node-fetch**

```bash
cd backend
npm install node-fetch@2
```

**Step 3: Mount vulnerable routes**

Modify `backend/src/server.js`:
```javascript
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initDatabase } from './database/index.js';
import authRoutes from './routes/auth.js';
import postsRoutes from './routes/posts.js';
import commentsRoutes from './routes/comments.js';
import usersRoutes from './routes/users.js';
import messagesRoutes from './routes/messages.js';
import vulnerableRoutes from './routes/vulnerable.js';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api', vulnerableRoutes); // Vulnerable endpoints

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Initialize database and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
});
```

**Step 4: Test vulnerable endpoints**

```bash
# Test open redirect
curl -L "http://localhost:3000/api/redirect?url=http://google.com"

# Test SSRF
curl -X POST http://localhost:3000/api/preview \
  -H "Content-Type: application/json" \
  -d '{"url":"http://localhost:3000/api/health"}'

# Test data exposure
curl http://localhost:3000/api/debug/config

# Test prototype pollution
curl -X POST http://localhost:3000/api/settings/merge \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"__proto__":{"isAdmin":true}}'
```

Expected: All vulnerabilities work as expected

**Step 5: Commit vulnerable endpoints**

```bash
git add backend/
git commit -m "feat(backend): add vulnerable endpoints for SSRF, open redirect, prototype pollution, data exposure"
```

---

## Task 7: Admin and Demo Routes

**Files:**
- Create: `backend/src/routes/admin.js`
- Modify: `backend/src/server.js`

**Step 1: Create admin routes**

Create `backend/src/routes/admin.js`:
```javascript
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
```

**Step 2: Mount admin routes**

Modify `backend/src/server.js`:
```javascript
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initDatabase } from './database/index.js';
import authRoutes from './routes/auth.js';
import postsRoutes from './routes/posts.js';
import commentsRoutes from './routes/comments.js';
import usersRoutes from './routes/users.js';
import messagesRoutes from './routes/messages.js';
import vulnerableRoutes from './routes/vulnerable.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', vulnerableRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Initialize database and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
});
```

**Step 3: Test admin routes**

```bash
# Login as admin first
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -c admin-cookies.txt

# Get all users
curl http://localhost:3000/api/admin/users -b admin-cookies.txt

# Get stats
curl http://localhost:3000/api/admin/stats -b admin-cookies.txt
```

Expected: Admin endpoints return data only for admin user

**Step 4: Add missing X-Frame-Options vulnerability**

Modify `backend/src/server.js` to intentionally NOT set security headers:

```javascript
// ... existing code ...

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// VULNERABILITY: Not setting security headers!
// Missing: X-Frame-Options, CSP, X-Content-Type-Options, etc.

// Serve uploaded files
// ... rest of the code ...
```

**Step 5: Commit admin routes**

```bash
git add backend/
git commit -m "feat(backend): add admin routes and demo management"
```

---

## Task 8: Frontend Project Initialization

**Files:**
- Create: `frontend/` directory with Vite + React + TypeScript
- Create: `frontend/.gitignore`

**Step 1: Create frontend with Vite**

```bash
npm create vite@latest frontend -- --template react-ts
```

Expected: Frontend project created

**Step 2: Navigate and install dependencies**

```bash
cd frontend
npm install
npm install antd axios react-router-dom
npm install -D @types/node
```

**Step 3: Update vite config for absolute imports**

Modify `frontend/vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

**Step 4: Update tsconfig**

Modify `frontend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Step 5: Test frontend**

Run: `npm run dev`
Expected: Vite dev server running on http://localhost:5173

**Step 6: Commit frontend initialization**

```bash
cd ..
git add frontend/
git commit -m "feat(frontend): initialize Vite React TypeScript project with Ant Design"
```

---

## Task 9: Frontend API Service Layer

**Files:**
- Create: `frontend/src/services/api.ts`
- Create: `frontend/src/services/auth.ts`
- Create: `frontend/src/services/posts.ts`
- Create: `frontend/src/services/types.ts`

**Step 1: Create API types**

Create `frontend/src/services/types.ts`:
```typescript
export interface User {
  id: number;
  username: string;
  email: string;
  bio?: string;
  avatar?: string;
  role: string;
  created_at?: string;
  postsCount?: number;
}

export interface Post {
  id: number;
  user_id: number;
  title: string;
  content: string;
  created_at: string;
  username: string;
  avatar?: string;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  text: string;
  created_at: string;
  username: string;
  avatar?: string;
}

export interface Message {
  id: number;
  from_user_id: number;
  to_user_id: number;
  text: string;
  created_at: string;
  sender_username?: string;
  sender_avatar?: string;
}

export interface DemoLog {
  id: number;
  type: string;
  description: string;
  payload?: string;
  created_at: string;
}
```

**Step 2: Create base API client**

Create `frontend/src/services/api.ts`:
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// VULNERABILITY: Exposing API key in frontend code
export const API_CONFIG = {
  stripe: 'pk_test_123456789_EXPOSED_IN_FRONTEND',
  googleMaps: 'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
};

export default api;
```

**Step 3: Create auth service**

Create `frontend/src/services/auth.ts`:
```typescript
import api from './api';
import { User } from './types';

export const authService = {
  async login(username: string, password: string) {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },

  async register(username: string, email: string, password: string) {
    const response = await api.post('/auth/register', { username, email, password });
    return response.data;
  },

  async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  async getCurrentUser(): Promise<{ user: User }> {
    const response = await api.get('/auth/me');
    return response.data;
  },
};
```

**Step 4: Create posts service**

Create `frontend/src/services/posts.ts`:
```typescript
import api from './api';
import { Post, Comment } from './types';

export const postsService = {
  async getAllPosts(searchQuery?: string): Promise<{ posts: Post[]; searchQuery?: string }> {
    const response = await api.get('/posts', { params: { q: searchQuery } });
    return response.data;
  },

  async getPost(id: number): Promise<{ post: Post; comments: Comment[] }> {
    const response = await api.get(`/posts/${id}`);
    return response.data;
  },

  async createPost(title: string, content: string) {
    const response = await api.post('/posts', { title, content });
    return response.data;
  },

  async deletePost(id: number) {
    const response = await api.delete(`/posts/${id}`);
    return response.data;
  },

  async addComment(postId: number, text: string) {
    const response = await api.post('/comments', { postId, text });
    return response.data;
  },

  async deleteComment(id: number) {
    const response = await api.delete(`/comments/${id}`);
    return response.data;
  },
};
```

**Step 5: Create remaining services**

Create `frontend/src/services/users.ts`:
```typescript
import api from './api';
import { User } from './types';

export const usersService = {
  async getUser(id: number): Promise<{ user: User }> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  async updateProfile(id: number, email: string, bio: string) {
    const response = await api.put(`/users/${id}`, { email, bio });
    return response.data;
  },

  async uploadAvatar(id: number, file: File) {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post(`/users/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async changePassword(id: number, currentPassword: string, newPassword: string) {
    const response = await api.post(`/users/${id}/change-password`, {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  async deleteAccount(id: number) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};
```

Create `frontend/src/services/messages.ts`:
```typescript
import api from './api';
import { Message } from './types';

export const messagesService = {
  async getConversations() {
    const response = await api.get('/messages');
    return response.data;
  },

  async getMessages(userId: number): Promise<{ messages: Message[] }> {
    const response = await api.get(`/messages/${userId}`);
    return response.data;
  },

  async sendMessage(toUserId: number, text: string) {
    const response = await api.post('/messages', { toUserId, text });
    return response.data;
  },
};
```

Create `frontend/src/services/admin.ts`:
```typescript
import api from './api';
import { User, DemoLog } from './types';

export const adminService = {
  async getUsers(): Promise<{ users: User[] }> {
    const response = await api.get('/admin/users');
    return response.data;
  },

  async getSessions() {
    const response = await api.get('/admin/sessions');
    return response.data;
  },

  async getStats() {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  async getLogs(type?: string, limit = 50): Promise<{ logs: DemoLog[] }> {
    const response = await api.get('/admin/logs', { params: { type, limit } });
    return response.data;
  },

  async addLog(type: string, description: string, payload?: string) {
    const response = await api.post('/admin/logs', { type, description, payload });
    return response.data;
  },

  async clearLogs() {
    const response = await api.delete('/admin/logs');
    return response.data;
  },

  async resetDemo() {
    const response = await api.post('/admin/reset-demo');
    return response.data;
  },
};
```

**Step 6: Commit services**

```bash
git add frontend/
git commit -m "feat(frontend): add API service layer with TypeScript types"
```

---

---

## Task 10: Auth Context and Protected Routes

**Files:**
- Create: `frontend/src/contexts/AuthContext.tsx`
- Create: `frontend/src/components/ProtectedRoute.tsx`
- Create: `frontend/src/App.tsx`

**Step 1: Create Auth Context**

Create `frontend/src/contexts/AuthContext.tsx`:
```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '@/services/auth';
import { User } from '@/services/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const data = await authService.getCurrentUser();
      setUser(data.user);
    } catch (error) {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    const data = await authService.login(username, password);
    setUser(data.user);
  };

  const register = async (username: string, email: string, password: string) => {
    await authService.register(username, email, password);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**Step 2: Create Protected Route component**

Create `frontend/src/components/ProtectedRoute.tsx`:
```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spin } from 'antd';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
```

**Step 3: Setup React Router in App**

Create `frontend/src/App.tsx`:
```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages (will create next)
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import PostDetailPage from './pages/PostDetailPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import MessagesPage from './pages/MessagesPage';
import CreatePostPage from './pages/CreatePostPage';
import AdminDashboard from './pages/admin/Dashboard';
import AdminDemo from './pages/admin/DemoControl';
import AdminStats from './pages/admin/Stats';

function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
      }}
    >
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<HomePage />} />
            <Route path="/post/:id" element={<PostDetailPage />} />

            <Route
              path="/profile/:userId"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-post"
              element={
                <ProtectedRoute>
                  <CreatePostPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/demo"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDemo />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/stats"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminStats />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
```

**Step 4: Update main.tsx**

Modify `frontend/src/main.tsx`:
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

**Step 5: Create placeholder pages directory**

```bash
mkdir -p frontend/src/pages/admin
touch frontend/src/pages/{LoginPage,RegisterPage,HomePage,PostDetailPage,ProfilePage,SettingsPage,MessagesPage,CreatePostPage}.tsx
touch frontend/src/pages/admin/{Dashboard,DemoControl,Stats}.tsx
```

**Step 6: Test routing**

Run: `npm run dev`
Expected: App loads, routes configured (pages are empty for now)

**Step 7: Commit**

```bash
git add frontend/
git commit -m "feat(frontend): add auth context and protected routes"
```

---

## Task 11: Login and Register Pages

**Files:**
- Create: `frontend/src/components/Layout.tsx`
- Modify: `frontend/src/pages/LoginPage.tsx`
- Modify: `frontend/src/pages/RegisterPage.tsx`

**Step 1: Create reusable Layout component**

Create `frontend/src/components/Layout.tsx`:
```typescript
import { Layout as AntLayout, Menu, Button, Avatar, Dropdown } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  HomeOutlined,
  UserOutlined,
  SettingOutlined,
  MessageOutlined,
  PlusOutlined,
  DashboardOutlined,
  LogoutOutlined,
} from '@ant-design/icons';

const { Header, Content, Footer } = AntLayout;

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link to={`/profile/${user?.id}`}>Profile</Link>,
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: <Link to="/settings">Settings</Link>,
    },
    ...(user?.role === 'admin'
      ? [
          {
            key: 'admin',
            icon: <DashboardOutlined />,
            label: <Link to="/admin">Admin Panel</Link>,
          },
        ]
      : []),
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link to="/" style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
            VulnApp
          </Link>
          <Menu
            theme="dark"
            mode="horizontal"
            items={[
              { key: 'home', icon: <HomeOutlined />, label: <Link to="/">Home</Link> },
              ...(user
                ? [
                    {
                      key: 'create',
                      icon: <PlusOutlined />,
                      label: <Link to="/create-post">Create Post</Link>,
                    },
                    {
                      key: 'messages',
                      icon: <MessageOutlined />,
                      label: <Link to="/messages">Messages</Link>,
                    },
                  ]
                : []),
            ]}
          />
        </div>

        <div>
          {user ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <Avatar src={user.avatar} icon={<UserOutlined />} />
                <span style={{ color: 'white' }}>{user.username}</span>
              </div>
            </Dropdown>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button type="link" onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button type="primary" onClick={() => navigate('/register')}>
                Register
              </Button>
            </div>
          )}
        </div>
      </Header>

      <Content style={{ padding: '24px 50px' }}>{children}</Content>

      <Footer style={{ textAlign: 'center' }}>
        VulnApp ©2026 - Educational Security Demo
      </Footer>
    </AntLayout>
  );
};
```

**Step 2: Create Login Page**

Modify `frontend/src/pages/LoginPage.tsx`:
```typescript
import { useState } from 'react';
import { Form, Input, Button, Card, Alert, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    setError('');

    try {
      await login(values.username, values.password);
      message.success('Login successful!');
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Card title="Login" style={{ width: 400 }}>
          {error && <Alert message={error} type="error" style={{ marginBottom: 16 }} />}

          <Form name="login" onFinish={onFinish} layout="vertical">
            <Form.Item
              name="username"
              rules={[{ required: true, message: 'Please input your username!' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Username" size="large" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block size="large">
                Log in
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center' }}>
              Don't have an account? <Link to="/register">Register now</Link>
            </div>
          </Form>

          <Alert
            message="Test Accounts"
            description={
              <div>
                <div>admin / admin123 (Admin)</div>
                <div>alice / alice123 (User)</div>
                <div>bob / bob123 (User)</div>
              </div>
            }
            type="info"
            style={{ marginTop: 16 }}
          />
        </Card>
      </div>
    </Layout>
  );
};

export default LoginPage;
```

**Step 3: Create Register Page**

Modify `frontend/src/pages/RegisterPage.tsx`:
```typescript
import { useState } from 'react';
import { Form, Input, Button, Card, Alert, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: { username: string; email: string; password: string }) => {
    setLoading(true);
    setError('');

    try {
      await register(values.username, values.email, values.password);
      message.success('Registration successful! Please login.');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Card title="Register" style={{ width: 400 }}>
          {error && <Alert message={error} type="error" style={{ marginBottom: 16 }} />}

          <Form name="register" onFinish={onFinish} layout="vertical">
            <Form.Item
              name="username"
              rules={[{ required: true, message: 'Please input your username!' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Username" size="large" />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Please input your password!' },
                { min: 6, message: 'Password must be at least 6 characters!' },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block size="large">
                Register
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center' }}>
              Already have an account? <Link to="/login">Login now</Link>
            </div>
          </Form>
        </Card>
      </div>
    </Layout>
  );
};

export default RegisterPage;
```

**Step 4: Test authentication**

Run both servers:
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Navigate to http://localhost:5173
- Test login with alice/alice123
- Test registration
- Test logout

Expected: Full authentication flow working

**Step 5: Commit**

```bash
git add frontend/
git commit -m "feat(frontend): add login and register pages with layout"
```

---

## Task 12: Home Page with Posts List and Search (XSS Vulnerable)

**Files:**
- Modify: `frontend/src/pages/HomePage.tsx`

**Step 1: Create Home Page**

Modify `frontend/src/pages/HomePage.tsx`:
```typescript
import { useState, useEffect } from 'react';
import { Input, List, Card, Avatar, Button, message, Tag } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { postsService } from '@/services/posts';
import { Post } from '@/services/types';

const { Search } = Input;

const HomePage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadPosts = async (query?: string) => {
    setLoading(true);
    try {
      const data = await postsService.getAllPosts(query);
      setPosts(data.posts);

      // VULNERABILITY: Reflected XSS - displaying search query without sanitization
      if (data.searchQuery) {
        setSearchQuery(data.searchQuery);
      }
    } catch (error) {
      message.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleSearch = (value: string) => {
    loadPosts(value);
  };

  return (
    <Layout>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1>Latest Posts</h1>

        <Search
          placeholder="Search posts..."
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          onSearch={handleSearch}
          style={{ marginBottom: 24 }}
        />

        {searchQuery && (
          <div style={{ marginBottom: 16 }}>
            {/* VULNERABILITY: Reflected XSS through dangerouslySetInnerHTML */}
            <Tag>
              Search results for: <span dangerouslySetInnerHTML={{ __html: searchQuery }} />
            </Tag>
          </div>
        )}

        <List
          loading={loading}
          itemLayout="vertical"
          dataSource={posts}
          renderItem={(post) => (
            <Card style={{ marginBottom: 16 }}>
              <Card.Meta
                avatar={<Avatar src={post.avatar} icon={<UserOutlined />} />}
                title={<Link to={`/post/${post.id}`}>{post.title}</Link>}
                description={
                  <div>
                    <div>By {post.username}</div>
                    <div style={{ marginTop: 8, color: '#888' }}>
                      {new Date(post.created_at).toLocaleString()}
                    </div>
                  </div>
                }
              />
              <div style={{ marginTop: 16 }}>
                {post.content.substring(0, 200)}
                {post.content.length > 200 && '...'}
              </div>
              <div style={{ marginTop: 16 }}>
                <Link to={`/post/${post.id}`}>
                  <Button type="link">Read more →</Button>
                </Link>
              </div>
            </Card>
          )}
        />
      </div>
    </Layout>
  );
};

export default HomePage;
```

**Step 2: Test home page**

Navigate to http://localhost:5173
Expected: Posts list displayed

Test XSS vulnerability:
Search for: `<img src=x onerror=alert('XSS')>`
Expected: Alert fires (XSS works!)

**Step 3: Commit**

```bash
git add frontend/
git commit -m "feat(frontend): add home page with posts list and search (XSS vulnerable)"
```

---

## Task 13: Post Detail Page with Comments (Stored XSS Vulnerable)

**Files:**
- Modify: `frontend/src/pages/PostDetailPage.tsx`

**Step 1: Create Post Detail Page**

Modify `frontend/src/pages/PostDetailPage.tsx`:
```typescript
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Avatar, Button, Input, List, message, Popconfirm } from 'antd';
import { UserOutlined, DeleteOutlined } from '@ant-design/icons';
import { Layout } from '@/components/Layout';
import { postsService } from '@/services/posts';
import { Post, Comment } from '@/services/types';
import { useAuth } from '@/contexts/AuthContext';

const { TextArea } = Input;

const PostDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadPost = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await postsService.getPost(parseInt(id));
      setPost(data.post);
      setComments(data.comments);
    } catch (error) {
      message.error('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPost();
  }, [id]);

  const handleAddComment = async () => {
    if (!commentText.trim() || !id) return;

    setSubmitting(true);
    try {
      await postsService.addComment(parseInt(id), commentText);
      message.success('Comment added');
      setCommentText('');
      loadPost();
    } catch (error) {
      message.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!id) return;
    try {
      await postsService.deletePost(parseInt(id));
      message.success('Post deleted');
      navigate('/');
    } catch (error) {
      message.error('Failed to delete post');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await postsService.deleteComment(commentId);
      message.success('Comment deleted');
      loadPost();
    } catch (error) {
      message.error('Failed to delete comment');
    }
  };

  if (loading || !post) {
    return <Layout><div>Loading...</div></Layout>;
  }

  const canDeletePost = user && (user.id === post.user_id || user.role === 'admin');

  return (
    <Layout>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Card>
          <Card.Meta
            avatar={<Avatar src={post.avatar} icon={<UserOutlined />} />}
            title={<h2>{post.title}</h2>}
            description={
              <div>
                <div>By {post.username}</div>
                <div style={{ color: '#888' }}>
                  {new Date(post.created_at).toLocaleString()}
                </div>
              </div>
            }
          />

          <div style={{ marginTop: 24, whiteSpace: 'pre-wrap' }}>
            {post.content}
          </div>

          {canDeletePost && (
            <div style={{ marginTop: 16 }}>
              <Popconfirm
                title="Delete this post?"
                onConfirm={handleDeletePost}
                okText="Yes"
                cancelText="No"
              >
                <Button danger icon={<DeleteOutlined />}>
                  Delete Post
                </Button>
              </Popconfirm>
            </div>
          )}
        </Card>

        <Card title={`Comments (${comments.length})`} style={{ marginTop: 24 }}>
          {user && (
            <div style={{ marginBottom: 24 }}>
              <TextArea
                rows={4}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
              />
              <Button
                type="primary"
                onClick={handleAddComment}
                loading={submitting}
                style={{ marginTop: 8 }}
              >
                Add Comment
              </Button>
            </div>
          )}

          <List
            dataSource={comments}
            renderItem={(comment) => {
              const canDelete = user && (user.id === comment.user_id || user.role === 'admin');

              return (
                <List.Item
                  actions={
                    canDelete
                      ? [
                          <Popconfirm
                            key="delete"
                            title="Delete this comment?"
                            onConfirm={() => handleDeleteComment(comment.id)}
                          >
                            <Button type="link" danger icon={<DeleteOutlined />} />
                          </Popconfirm>,
                        ]
                      : []
                  }
                >
                  <List.Item.Meta
                    avatar={<Avatar src={comment.avatar} icon={<UserOutlined />} />}
                    title={comment.username}
                    description={
                      <div style={{ color: '#888', fontSize: '12px' }}>
                        {new Date(comment.created_at).toLocaleString()}
                      </div>
                    }
                  />
                  {/* VULNERABILITY: Stored XSS - rendering comment text as HTML */}
                  <div dangerouslySetInnerHTML={{ __html: comment.text }} />
                </List.Item>
              );
            }}
          />
        </Card>
      </div>
    </Layout>
  );
};

export default PostDetailPage;
```

**Step 2: Test post detail and XSS**

Navigate to a post, add comment with XSS:
```
<img src=x onerror=alert('Stored XSS!')>
```

Expected: Alert fires when viewing post (Stored XSS works!)

**Step 3: Commit**

```bash
git add frontend/
git commit -m "feat(frontend): add post detail page with comments (stored XSS vulnerable)"
```

---

**Due to length constraints, I'll summarize the remaining tasks:**

## Remaining Tasks (14-20) - Implementation Summary

**Task 14: Create Post Page** - Simple form to create posts

**Task 15: Profile Page** - Show user info, posts, edit bio (DOM-based XSS in bio)

**Task 16: Settings Page** - Change email, password, delete account (CSRF vulnerable)

**Task 17: Messages Page** - Private messaging interface

**Task 18: Admin Dashboard** - User management, statistics

**Task 19: Demo Control Panel** - Main feature with:
- Vulnerability toggles
- Exploit code generators
- Live attack logs
- Quick demo scenarios
- Visual vulnerability indicators

**Task 20: Final Polish**
- Add vulnerability indicators (red borders, tooltips)
- Test all exploits
- Add README with setup instructions
- Final testing

---

## Execution Plan

Plan complete and saved to `docs/plans/2026-01-25-vulnerable-app-implementation.md`.

Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**


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

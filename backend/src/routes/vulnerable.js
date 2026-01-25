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

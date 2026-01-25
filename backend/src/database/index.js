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

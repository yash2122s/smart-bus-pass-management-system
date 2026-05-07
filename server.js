import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
const SALT_ROUNDS = 10;

// Security Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Rate Limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, // Increased for dev ease, but restricted for security
  message: { message: 'Too many login attempts. Try again after 15 minutes.' }
});

// Database Setup
const db = new sqlite3.Database(process.env.DB_PATH || './transit.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS admins (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    name TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS passes (
    id TEXT PRIMARY KEY,
    passId TEXT,
    userId TEXT,
    userName TEXT,
    userEmail TEXT,
    fullName TEXT,
    email TEXT,
    phone TEXT,
    passType TEXT,
    startDate TEXT,
    expiryDate TEXT,
    duration INTEGER,
    status TEXT,
    rejectionReason TEXT,
    createdAt TEXT
  )`);

  // Conductors table — replaces hardcoded frontend credentials
  db.run(`CREATE TABLE IF NOT EXISTS conductors (
    id TEXT PRIMARY KEY,
    name TEXT,
    pin TEXT,
    route TEXT,
    isActive INTEGER DEFAULT 1
  )`);

  // Initial Admin Setup (using hashes)
  db.get("SELECT * FROM admins WHERE username = 'admin'", async (err, row) => {
    if (!row) {
      const hashedPassword = await bcrypt.hash('password@123', SALT_ROUNDS);
      db.run("INSERT INTO admins (id, username, password, name) VALUES (?, ?, ?, ?)", 
        ['admin_1', 'admin', hashedPassword, 'System Admin']);
      console.log("Default admin account created with hash.");
    }
  });

  // Seed default conductors (hashed PINs)
  db.get("SELECT COUNT(*) as count FROM conductors", async (err, row) => {
    if (!row || row.count === 0) {
      const conductors = [
        { id: 'COND001', name: 'Ravi Kumar', pin: '1234', route: 'Route 5C' },
        { id: 'COND002', name: 'Suresh Babu', pin: '5678', route: 'Route 12A' },
        { id: 'COND003', name: 'Priya Devi', pin: '9999', route: 'Route 8B' }
      ];
      for (const c of conductors) {
        const hashedPin = await bcrypt.hash(c.pin, SALT_ROUNDS);
        db.run("INSERT INTO conductors (id, name, pin, route) VALUES (?, ?, ?, ?)",
          [c.id, c.name, hashedPin, c.route]);
      }
      console.log("Default conductor accounts created with hashed PINs.");
    }
  });

  // Migration: Add rejectionReason column if it doesn't exist.
  // SQLite doesn't support IF NOT EXISTS for ADD COLUMN, so we catch the error silently.
  db.run("ALTER TABLE passes ADD COLUMN rejectionReason TEXT", (err) => {
    // Column already exists — ignore error
  });
});

// --- HELPERS ---

function computePassStatus(startDate, expiryDate, dbStatus) {
  // Only compute date-based status for approved passes.
  // Pending and rejected passes keep their admin-set status.
  if (dbStatus === 'pending' || dbStatus === 'rejected') return dbStatus;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  const end = new Date(expiryDate);

  if (today < start) return 'upcoming';
  if (today > end) return 'expired';
  return 'active';
}

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
};

// --- API Endpoints ---

// Login
app.post('/api/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = email ? email.trim() : '';
  const cleanPassword = password ? password.trim() : '';

  // Check Users
  db.get("SELECT * FROM users WHERE email = ?", [cleanEmail], async (err, user) => {
    if (user) {
      const isMatch = await bcrypt.compare(cleanPassword, user.password);
      if (isMatch) {
        const token = jwt.sign({ id: user.id, role: 'user', email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '8h' });
        return res.json({ user: { ...user, role: 'user', password: undefined }, token });
      }
    }

    // Check Admins
    db.get("SELECT * FROM admins WHERE LOWER(username) = LOWER(?)", [cleanEmail], async (err, admin) => {
      if (admin) {
        const isMatch = await bcrypt.compare(cleanPassword, admin.password);
        if (isMatch) {
          const token = jwt.sign({ id: admin.id, role: 'admin', username: admin.username, name: admin.name }, JWT_SECRET, { expiresIn: '8h' });
          return res.json({ user: { ...admin, role: 'admin', password: undefined }, token });
        }
      }
      res.status(401).json({ message: 'Invalid credentials' });
    });
  });
});

// Register
app.post('/api/register', [
  body('name').trim().isLength({ min: 2 }).escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password } = req.body;
  const id = 'user_' + Date.now();
  
  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    db.run("INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)", 
      [id, name, email, hashedPassword], (err) => {
      if (err) {
        if (err.message.includes('UNIQUE')) return res.status(400).json({ message: 'Email already registered' });
        return res.status(500).json({ message: err.message });
      }
      const token = jwt.sign({ id, role: 'user', email, name }, JWT_SECRET, { expiresIn: '8h' });
      res.json({ user: { id, name, email, role: 'user' }, token });
    });
  } catch (err) {
    res.status(500).json({ message: 'Error hashing password' });
  }
});

// Conductor Login (backend-authenticated, no longer hardcoded in frontend)
app.post('/api/conductor/login', loginLimiter, async (req, res) => {
  const { id, pin } = req.body;
  const cleanId = id ? id.trim().toUpperCase() : '';
  const cleanPin = pin ? pin.trim() : '';

  db.get("SELECT * FROM conductors WHERE UPPER(id) = ? AND isActive = 1", [cleanId], async (err, conductor) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!conductor) return res.status(401).json({ message: 'Invalid Conductor ID or PIN' });

    const isMatch = await bcrypt.compare(cleanPin, conductor.pin);
    if (!isMatch) return res.status(401).json({ message: 'Invalid Conductor ID or PIN' });

    const token = jwt.sign(
      { id: conductor.id, role: 'conductor', name: conductor.name, route: conductor.route },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      conductor: { id: conductor.id, name: conductor.name, route: conductor.route },
      token
    });
  });
});

// Submit Pass
app.post('/api/passes', authenticateToken, (req, res) => {
  const { fullName, email, phone, passType, startDate, duration, passId, expiryDate } = req.body;
  const id = 'pass_' + Date.now();
  const createdAt = new Date().toISOString();
  
  const userId = req.user.id;
  const userName = req.user.name || fullName;
  const userEmail = req.user.email || email;

  db.run(`INSERT INTO passes (id, passId, userId, userName, userEmail, fullName, email, phone, passType, startDate, expiryDate, duration, status, rejectionReason, createdAt) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, passId, userId, userName, userEmail, fullName, email, phone, passType, startDate, expiryDate, duration, 'pending', null, createdAt], 
    (err) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ id, passId, status: 'pending', createdAt });
    });
});

// Verify Pass (Conductor)
app.get('/api/passes/verify/:passId', (req, res) => {
  const query = "SELECT * FROM passes WHERE UPPER(passId) = UPPER(?)";
  db.get(query, [req.params.passId], (err, row) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!row) return res.status(404).json({ message: 'Pass not found' });
    
    const status = computePassStatus(row.startDate, row.expiryDate, row.status);
    res.json({ ...row, status });
  });
});

// Get My Passes
app.get('/api/passes/user/:userId', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin' && req.user.id !== req.params.userId) {
    return res.status(403).json({ message: 'Unauthorized access.' });
  }

  db.all("SELECT * FROM passes WHERE userId = ? ORDER BY createdAt DESC", [req.params.userId], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    const passes = rows.map(pass => ({
      ...pass,
      status: computePassStatus(pass.startDate, pass.expiryDate, pass.status)
    }));
    res.json(passes);
  });
});

// Get All Passes (Admin) — with optional query filters
app.get('/api/passes', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });

  db.all("SELECT * FROM passes ORDER BY createdAt DESC", (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    const passes = rows.map(pass => ({
      ...pass,
      status: computePassStatus(pass.startDate, pass.expiryDate, pass.status)
    }));
    res.json(passes);
  });
});

// Get All Users (Admin)
app.get('/api/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });

  db.all("SELECT id, name, email FROM users", (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
});

// Update Pass Status (Admin) — now supports rejectionReason
app.patch('/api/passes/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });

  const { status, rejectionReason } = req.body;

  if (status === 'rejected' && rejectionReason) {
    db.run("UPDATE passes SET status = ?, rejectionReason = ? WHERE id = ?", [status, rejectionReason, req.params.id], (err) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ success: true });
    });
  } else {
    db.run("UPDATE passes SET status = ?, rejectionReason = NULL WHERE id = ?", [status, req.params.id], (err) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ success: true });
    });
  }
});

// Get All Conductors (Admin)
app.get('/api/conductors', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });

  db.all("SELECT id, name, route, isActive FROM conductors", (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

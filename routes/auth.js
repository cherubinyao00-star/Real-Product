const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { db }   = require('../db/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// ── POST /api/auth/register ──────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: 'Nom, email et mot de passe sont obligatoires.' });

  if (password.length < 6)
    return res.status(400).json({ error: 'Le mot de passe doit faire au moins 6 caractères.' });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email))
    return res.status(400).json({ error: 'Adresse email invalide.' });

  try {
    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [email.toLowerCase()]
    });
    if (existing.rows.length > 0)
      return res.status(409).json({ error: 'Un compte existe déjà avec cet email.' });

    const hashed = await bcrypt.hash(password, 12);

    const result = await db.execute({
      sql: 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      args: [name.trim(), email.toLowerCase(), hashed]
    });

    const token = jwt.sign(
      { id: Number(result.lastInsertRowid), email: email.toLowerCase(), role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(201).json({
      message: 'Compte créé avec succès !',
      token,
      user: { id: Number(result.lastInsertRowid), name: name.trim(), email: email.toLowerCase(), role: 'user', points: 0 }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email et mot de passe requis.' });

  try {
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email.toLowerCase()]
    });

    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });

    const token = jwt.sign(
      { id: Number(user.id), email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.json({
      message: 'Connexion réussie !',
      token,
      user: {
        id: Number(user.id),
        name: user.name,
        email: user.email,
        role: user.role,
        points: Number(user.points)
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT id, name, email, role, points, created_at FROM users WHERE id = ?',
      args: [req.user.id]
    });
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    // Nombre de prix ajoutés par l'utilisateur
    const contribs = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM prices WHERE user_id = ?',
      args: [req.user.id]
    });

    return res.json({
      ...user,
      id: Number(user.id),
      points: Number(user.points),
      contributions: Number(contribs.rows[0].count)
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ── PUT /api/auth/me ─────────────────────────────────────────────
router.put('/me', auth, async (req, res) => {
  const { name, currentPassword, newPassword } = req.body;
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [req.user.id]
    });
    const user = result.rows[0];

    let updates = [];
    let args = [];

    if (name) { updates.push('name = ?'); args.push(name.trim()); }

    if (newPassword) {
      if (!currentPassword)
        return res.status(400).json({ error: 'Mot de passe actuel requis pour en changer.' });
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid)
        return res.status(401).json({ error: 'Mot de passe actuel incorrect.' });
      if (newPassword.length < 6)
        return res.status(400).json({ error: 'Le nouveau mot de passe doit faire au moins 6 caractères.' });
      updates.push('password = ?');
      args.push(await bcrypt.hash(newPassword, 12));
    }

    if (updates.length === 0)
      return res.status(400).json({ error: 'Aucune modification fournie.' });

    args.push(req.user.id);
    await db.execute({ sql: `UPDATE users SET ${updates.join(', ')} WHERE id = ?`, args });

    return res.json({ message: 'Profil mis à jour.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;

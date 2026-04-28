const express  = require('express');
const { db }   = require('../db/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/stores ──────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { type, city, q } = req.query;
  try {
    let sql  = 'SELECT * FROM stores WHERE 1=1';
    const args = [];
    if (type) { sql += ' AND type = ?'; args.push(type); }
    if (city) { sql += ' AND city LIKE ?'; args.push(`%${city}%`); }
    if (q)    { sql += ' AND (name LIKE ? OR neighborhood LIKE ?)'; args.push(`%${q}%`, `%${q}%`); }
    sql += ' ORDER BY name';
    const result = await db.execute({ sql, args });
    return res.json(result.rows.map(r => ({ ...r, id: Number(r.id) })));
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ── GET /api/stores/:id ──────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM stores WHERE id = ?',
      args: [Number(req.params.id)]
    });
    if (!result.rows[0]) return res.status(404).json({ error: 'Magasin introuvable.' });

    // Nombre de prix référencés
    const count = await db.execute({
      sql: 'SELECT COUNT(DISTINCT product_id) as count FROM prices WHERE store_id = ?',
      args: [Number(req.params.id)]
    });

    return res.json({ ...result.rows[0], id: Number(result.rows[0].id), products_count: Number(count.rows[0].count) });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ── POST /api/stores ─────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  const { name, type, city, neighborhood, lat, lng } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'Nom et type requis.' });
  if (!['marche', 'supermarche', 'boutique'].includes(type))
    return res.status(400).json({ error: 'type doit être: marche, supermarche ou boutique.' });

  try {
    const result = await db.execute({
      sql: 'INSERT INTO stores (name, type, city, neighborhood, lat, lng, created_by) VALUES (?,?,?,?,?,?,?)',
      args: [name.trim(), type, city || 'Abidjan', neighborhood || null, lat || null, lng || null, req.user.id]
    });
    return res.status(201).json({ id: Number(result.lastInsertRowid), message: 'Magasin ajouté !' });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;

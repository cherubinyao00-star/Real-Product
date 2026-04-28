const express       = require('express');
const { db }        = require('../db/database');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/products ────────────────────────────────────────────
// Recherche de produits + liste
router.get('/', async (req, res) => {
  const { q, category_id, limit = 20, offset = 0 } = req.query;
  try {
    let sql  = `SELECT p.*, c.name as category FROM products p
                LEFT JOIN categories c ON c.id = p.category_id WHERE 1=1`;
    const args = [];
    if (q) { sql += ' AND p.name LIKE ?'; args.push(`%${q}%`); }
    if (category_id) { sql += ' AND p.category_id = ?'; args.push(Number(category_id)); }
    sql += ' ORDER BY p.name LIMIT ? OFFSET ?';
    args.push(Number(limit), Number(offset));
    const result = await db.execute({ sql, args });
    return res.json(result.rows.map(r => ({ ...r, id: Number(r.id), category_id: Number(r.category_id) })));
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ── GET /api/products/:id ────────────────────────────────────────
// Détail d'un produit + ses prix récents par magasin
router.get('/:id', async (req, res) => {
  try {
    const prod = await db.execute({
      sql: `SELECT p.*, c.name as category FROM products p
            LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?`,
      args: [Number(req.params.id)]
    });
    if (!prod.rows[0]) return res.status(404).json({ error: 'Produit introuvable.' });

    // Prix les plus récents par magasin (1 par magasin)
    const prices = await db.execute({
      sql: `SELECT pr.id, pr.price, pr.created_at,
                   s.id as store_id, s.name as store_name, s.type as store_type,
                   s.neighborhood, s.lat, s.lng,
                   u.name as contributor
            FROM prices pr
            JOIN stores s ON s.id = pr.store_id
            JOIN users u  ON u.id = pr.user_id
            WHERE pr.product_id = ?
              AND pr.id IN (
                SELECT id FROM prices
                WHERE product_id = ?
                GROUP BY store_id
                HAVING id = MAX(id)
              )
            ORDER BY pr.price ASC`,
      args: [Number(req.params.id), Number(req.params.id)]
    });

    return res.json({
      ...prod.rows[0],
      id: Number(prod.rows[0].id),
      prices: prices.rows.map(r => ({
        ...r,
        id: Number(r.id),
        price: Number(r.price),
        store_id: Number(r.store_id)
      }))
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ── POST /api/products ───────────────────────────────────────────
// Ajouter un produit (utilisateur connecté)
router.post('/', auth, async (req, res) => {
  const { name, category_id, unit } = req.body;
  if (!name) return res.status(400).json({ error: 'Le nom du produit est obligatoire.' });
  try {
    const result = await db.execute({
      sql: 'INSERT INTO products (name, category_id, unit, created_by) VALUES (?, ?, ?, ?)',
      args: [name.trim(), category_id || null, unit || 'unité', req.user.id]
    });
    return res.status(201).json({ id: Number(result.lastInsertRowid), name: name.trim(), unit: unit || 'unité' });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ── GET /api/products/categories/all ────────────────────────────
router.get('/categories/all', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM categories ORDER BY name');
    return res.json(result.rows.map(r => ({ ...r, id: Number(r.id) })));
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;

// ── POST /api/products/categories ───────────────────────────────
// Ajouter une nouvelle catégorie
router.post('/categories', auth, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Le nom de la catégorie est obligatoire.' });
  try {
    const result = await db.execute({
      sql: 'INSERT INTO categories (name) VALUES (?)',
      args: [name.trim()]
    });
    return res.status(201).json({ id: Number(result.lastInsertRowid), name: name.trim(), message: `Catégorie "${name.trim()}" créée !` });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return res.status(409).json({ error: 'Cette catégorie existe déjà.' });
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});

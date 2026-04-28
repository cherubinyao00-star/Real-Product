const express  = require('express');
const { db }   = require('../db/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/prices/recent ───────────────────────────────────────
// Flux en temps réel — derniers prix ajoutés
router.get('/recent', async (req, res) => {
  const { limit = 20 } = req.query;
  try {
    const result = await db.execute({
      sql: `SELECT pr.id, pr.price, pr.created_at,
                   p.name as product_name, p.unit,
                   s.name as store_name, s.type as store_type, s.neighborhood,
                   u.name as contributor
            FROM prices pr
            JOIN products p ON p.id = pr.product_id
            JOIN stores   s ON s.id = pr.store_id
            JOIN users    u ON u.id = pr.user_id
            ORDER BY pr.created_at DESC
            LIMIT ?`,
      args: [Number(limit)]
    });
    return res.json(result.rows.map(r => ({ ...r, id: Number(r.id), price: Number(r.price) })));
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ── GET /api/prices/history/:product_id ─────────────────────────
// Historique des prix d'un produit (pour graphique d'évolution)
router.get('/history/:product_id', async (req, res) => {
  const { store_id, days = 30 } = req.query;
  try {
    let sql = `SELECT pr.price, pr.created_at,
                      s.name as store_name, s.id as store_id
               FROM prices pr
               JOIN stores s ON s.id = pr.store_id
               WHERE pr.product_id = ?
                 AND pr.created_at >= datetime('now', ? )`;
    const args = [Number(req.params.product_id), `-${Number(days)} days`];

    if (store_id) { sql += ' AND pr.store_id = ?'; args.push(Number(store_id)); }
    sql += ' ORDER BY pr.created_at ASC';

    const result = await db.execute({ sql, args });
    return res.json(result.rows.map(r => ({ ...r, price: Number(r.price), store_id: Number(r.store_id) })));
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ── POST /api/prices ─────────────────────────────────────────────
// Ajouter un prix (utilisateur connecté)
router.post('/', auth, async (req, res) => {
  const { product_id, store_id, price } = req.body;

  if (!product_id || !store_id || !price)
    return res.status(400).json({ error: 'product_id, store_id et price sont obligatoires.' });

  if (!Number.isInteger(Number(price)) || Number(price) <= 0)
    return res.status(400).json({ error: 'Le prix doit être un nombre entier positif (en FCFA).' });

  try {
    // Vérifier que le produit et le magasin existent
    const [prod, store] = await Promise.all([
      db.execute({ sql: 'SELECT id FROM products WHERE id = ?', args: [Number(product_id)] }),
      db.execute({ sql: 'SELECT id FROM stores WHERE id = ?',   args: [Number(store_id)]   })
    ]);
    if (!prod.rows[0])  return res.status(404).json({ error: 'Produit introuvable.' });
    if (!store.rows[0]) return res.status(404).json({ error: 'Magasin introuvable.' });

    // Insérer le prix
    const result = await db.execute({
      sql: 'INSERT INTO prices (product_id, store_id, user_id, price) VALUES (?, ?, ?, ?)',
      args: [Number(product_id), Number(store_id), req.user.id, Number(price)]
    });

    // Créditer +5 points au contributeur
    await db.execute({
      sql: 'UPDATE users SET points = points + 5 WHERE id = ?',
      args: [req.user.id]
    });

    return res.status(201).json({
      id: Number(result.lastInsertRowid),
      message: 'Prix ajouté ! +5 points crédités.',
      price: Number(price)
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ── POST /api/prices/:id/vote ────────────────────────────────────
// Voter pour confirmer ou contester un prix
router.post('/:id/vote', auth, async (req, res) => {
  const { vote } = req.body;
  if (![1, -1].includes(Number(vote)))
    return res.status(400).json({ error: 'vote doit être 1 (confirmer) ou -1 (contester).' });

  try {
    // Empêcher de voter sur son propre prix
    const price = await db.execute({
      sql: 'SELECT user_id FROM prices WHERE id = ?',
      args: [Number(req.params.id)]
    });
    if (!price.rows[0]) return res.status(404).json({ error: 'Prix introuvable.' });
    if (Number(price.rows[0].user_id) === req.user.id)
      return res.status(403).json({ error: 'Vous ne pouvez pas voter pour votre propre contribution.' });

    await db.execute({
      sql: `INSERT INTO price_votes (price_id, user_id, vote) VALUES (?, ?, ?)
            ON CONFLICT(price_id, user_id) DO UPDATE SET vote = excluded.vote`,
      args: [Number(req.params.id), req.user.id, Number(vote)]
    });

    return res.json({ message: vote === 1 ? 'Prix confirmé !' : 'Prix contesté.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;

// ── DELETE /api/prices/:id ───────────────────────────────────────
// Supprimer un prix (auteur ou admin seulement)
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT user_id FROM prices WHERE id = ?',
      args: [Number(req.params.id)]
    });
    if (!result.rows[0])
      return res.status(404).json({ error: 'Prix introuvable.' });

    const isOwner = Number(result.rows[0].user_id) === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin)
      return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos propres prix.' });

    await db.execute({ sql: 'DELETE FROM prices WHERE id = ?', args: [Number(req.params.id)] });

    // Retirer 5 points si c'est l'auteur qui supprime
    if (isOwner) {
      await db.execute({
        sql: 'UPDATE users SET points = MAX(0, points - 5) WHERE id = ?',
        args: [req.user.id]
      });
    }

    return res.json({ message: 'Prix supprimé.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});

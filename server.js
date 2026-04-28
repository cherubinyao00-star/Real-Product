require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { initSchema } = require('./db/database');

// Routes
const authRoutes     = require('./routes/auth');
const productRoutes  = require('./routes/products');
const priceRoutes    = require('./routes/prices');
const storeRoutes    = require('./routes/stores');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── MIDDLEWARE ───────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Log des requêtes en développement
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── ROUTES ───────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/prices',   priceRoutes);
app.use('/api/stores',   storeRoutes);

// ── STATIC FRONTEND ──────────────────────────────────────────────
app.use(express.static('public'));

// Routes des pages frontend
app.get('/search',  (_req, res) => res.sendFile('search.html',  { root: './public' }));
app.get('/profile', (_req, res) => res.sendFile('profile.html', { root: './public' }));

// ── ROUTE D'ACCUEIL ──────────────────────────────────────────────
app.get('/api', (_req, res) => {
  res.json({
    name:    'RealProduct API',
    version: '1.0.0',
    status:  'online',
    endpoints: {
      auth:     '/api/auth     → register, login, me',
      products: '/api/products → liste, recherche, détail',
      prices:   '/api/prices   → flux récent, historique, ajouter, voter',
      stores:   '/api/stores   → liste, détail, ajouter'
    }
  });
});

// ── 404 ──────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route introuvable.' }));

// ── ERREURS GLOBALES ─────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur interne du serveur.' });
});

// ── DÉMARRAGE ────────────────────────────────────────────────────
async function start() {
  await initSchema();
  app.listen(PORT, () => {
    console.log(`\n🚀 RealProduct API démarrée sur http://localhost:${PORT}`);
    console.log(`📖 Documentation : http://localhost:${PORT}/api\n`);
  });
}

start().catch(err => { console.error('Erreur au démarrage :', err); process.exit(1); });

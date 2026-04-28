// seed.js — Remplissage de la base de données RealProduct
// Produits et prix réalistes des marchés d'Abidjan
require('dotenv').config();
const { db, initSchema } = require('./db/database');

async function seed() {
  await initSchema();

  console.log('🌱 Remplissage de la base de données...\n');

  // ── MAGASINS ────────────────────────────────────────────────────
  const stores = [
    { id: 1,  name: 'Marché Adjamé',          type: 'marche',      neighborhood: 'Adjamé',    lat: 5.3610, lng: -4.0165 },
    { id: 2,  name: 'Marché Cocody',           type: 'marche',      neighborhood: 'Cocody',    lat: 5.3540, lng: -3.9920 },
    { id: 3,  name: 'Marché de Treichville',   type: 'marche',      neighborhood: 'Treichville', lat: 5.2966, lng: -4.0050 },
    { id: 4,  name: 'Marché Abobo',            type: 'marche',      neighborhood: 'Abobo',     lat: 5.4170, lng: -4.0130 },
    { id: 5,  name: 'Marché de Yopougon',      type: 'marche',      neighborhood: 'Yopougon',  lat: 5.3456, lng: -4.0789 },
    { id: 6,  name: 'Marché Port-Bouët',       type: 'marche',      neighborhood: 'Port-Bouët', lat: 5.2590, lng: -3.9300 },
    { id: 7,  name: 'Carrefour Marcory',       type: 'supermarche', neighborhood: 'Marcory',   lat: 5.2900, lng: -3.9912 },
    { id: 8,  name: 'Sococé Abidjan',          type: 'supermarche', neighborhood: 'Plateau',   lat: 5.3218, lng: -4.0228 },
    { id: 9,  name: 'Leader Price Plateau',    type: 'supermarche', neighborhood: 'Plateau',   lat: 5.3177, lng: -4.0230 },
    { id: 10, name: 'Auchan Abidjan',          type: 'supermarche', neighborhood: 'Cocody',    lat: 5.3600, lng: -3.9800 },
    { id: 11, name: 'Cash Center Yopougon',    type: 'supermarche', neighborhood: 'Yopougon',  lat: 5.3490, lng: -4.0720 },
    { id: 12, name: 'Marché Banco',            type: 'marche',      neighborhood: 'Yopougon',  lat: 5.3300, lng: -4.0850 },
  ];

  for (const s of stores) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO stores (id, name, type, city, neighborhood, lat, lng) VALUES (?,?,?,?,?,?,?)`,
      args: [s.id, s.name, s.type, 'Abidjan', s.neighborhood, s.lat, s.lng]
    });
  }
  console.log(`✅ ${stores.length} magasins ajoutés`);

  // ── CATEGORIES ──────────────────────────────────────────────────
  const categories = [
    { id: 1, name: 'Légumes' },
    { id: 2, name: 'Fruits' },
    { id: 3, name: 'Céréales & Féculents' },
    { id: 4, name: 'Viandes & Poissons' },
    { id: 5, name: 'Produits laitiers' },
    { id: 6, name: 'Huiles & Condiments' },
    { id: 7, name: 'Boissons' },
    { id: 8, name: 'Entretien & Hygiène' },
    { id: 9, name: 'Tubercules & Plantains' },
    { id: 10, name: 'Épices & Aromates' },
  ];

  for (const c of categories) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO categories (id, name) VALUES (?,?)`,
      args: [c.id, c.name]
    });
  }
  console.log(`✅ ${categories.length} catégories ajoutées`);

  // ── PRODUITS ─────────────────────────────────────────────────────
  const products = [
    // Légumes
    { id: 1,  name: 'Tomates rondes',      cat: 1, unit: '1 kg' },
    { id: 2,  name: 'Oignons',             cat: 1, unit: '1 kg' },
    { id: 3,  name: 'Piments frais',       cat: 1, unit: '250 g' },
    { id: 4,  name: 'Gombo frais',         cat: 1, unit: '500 g' },
    { id: 5,  name: 'Aubergines',          cat: 1, unit: '1 kg' },
    { id: 6,  name: 'Carottes',            cat: 1, unit: '1 kg' },
    { id: 7,  name: 'Haricots verts',      cat: 1, unit: '500 g' },
    { id: 8,  name: 'Chou',               cat: 1, unit: '1 pièce' },
    // Fruits
    { id: 9,  name: 'Bananes douce',       cat: 2, unit: '1 régime' },
    { id: 10, name: 'Ananas',             cat: 2, unit: '1 pièce' },
    { id: 11, name: 'Mangues',            cat: 2, unit: '1 kg' },
    { id: 12, name: 'Papayes',            cat: 2, unit: '1 pièce' },
    { id: 13, name: 'Oranges',            cat: 2, unit: '1 kg' },
    { id: 14, name: 'Citrons verts',      cat: 2, unit: '10 pièces' },
    // Céréales & Féculents
    { id: 15, name: 'Riz parfumé',        cat: 3, unit: '5 kg' },
    { id: 16, name: 'Riz local',          cat: 3, unit: '5 kg' },
    { id: 17, name: 'Farine de blé',      cat: 3, unit: '1 kg' },
    { id: 18, name: 'Semoule de maïs',    cat: 3, unit: '1 kg' },
    { id: 19, name: 'Haricots secs',      cat: 3, unit: '1 kg' },
    { id: 20, name: 'Mil',               cat: 3, unit: '1 kg' },
    // Viandes & Poissons
    { id: 21, name: 'Poulet entier',      cat: 4, unit: '1 kg' },
    { id: 22, name: 'Poisson fumé',       cat: 4, unit: '500 g' },
    { id: 23, name: 'Thon en boîte',      cat: 4, unit: '185 g' },
    { id: 24, name: 'Sardines en boîte',  cat: 4, unit: '125 g' },
    { id: 25, name: 'Bœuf',              cat: 4, unit: '1 kg' },
    { id: 26, name: 'Crevettes fraîches', cat: 4, unit: '500 g' },
    // Produits laitiers
    { id: 27, name: 'Lait concentré sucré', cat: 5, unit: '410 g' },
    { id: 28, name: 'Lait en poudre',     cat: 5, unit: '400 g' },
    { id: 29, name: 'Yaourt nature',      cat: 5, unit: '125 g' },
    // Huiles & Condiments
    { id: 30, name: 'Huile de palme',     cat: 6, unit: '1 L' },
    { id: 31, name: 'Huile végétale',     cat: 6, unit: '1 L' },
    { id: 32, name: 'Sucre blanc',        cat: 6, unit: '1 kg' },
    { id: 33, name: 'Sel',               cat: 6, unit: '1 kg' },
    { id: 34, name: 'Cube Maggi',         cat: 6, unit: '10 cubes' },
    { id: 35, name: 'Tomate concentrée',  cat: 6, unit: '70 g' },
    // Boissons
    { id: 36, name: 'Eau minérale',       cat: 7, unit: '1.5 L' },
    { id: 37, name: 'Jus de fruits',      cat: 7, unit: '1 L' },
    { id: 38, name: 'Bière Flag',         cat: 7, unit: '65 cl' },
    // Entretien & Hygiène
    { id: 39, name: 'Savon Omo',          cat: 8, unit: '800 g' },
    { id: 40, name: 'Savon de Marseille', cat: 8, unit: '400 g' },
    { id: 41, name: 'Dentifrice Colgate', cat: 8, unit: '75 ml' },
    // Tubercules & Plantains
    { id: 42, name: 'Igname',            cat: 9, unit: '1 kg' },
    { id: 43, name: 'Manioc',            cat: 9, unit: '1 kg' },
    { id: 44, name: 'Banane plantain',    cat: 9, unit: '1 régime' },
    { id: 45, name: 'Patate douce',      cat: 9, unit: '1 kg' },
    // Épices & Aromates
    { id: 46, name: 'Gingembre frais',   cat: 10, unit: '250 g' },
    { id: 47, name: 'Ail',              cat: 10, unit: '250 g' },
    { id: 48, name: 'Poivre noir',       cat: 10, unit: '100 g' },
  ];

  for (const p of products) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO products (id, name, category_id, unit) VALUES (?,?,?,?)`,
      args: [p.id, p.name, p.cat, p.unit]
    });
  }
  console.log(`✅ ${products.length} produits ajoutés`);

  // ── UTILISATEUR SYSTEM ───────────────────────────────────────────
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash('system123', 10);
  await db.execute({
    sql: `INSERT OR IGNORE INTO users (id, name, email, password, role, points) VALUES (1, 'RealProduct', 'system@realproduct.ci', ?, 'admin', 9999)`,
    args: [hash]
  });

  // ── PRIX RÉALISTES ───────────────────────────────────────────────
  // [product_id, store_id, price]
  const prices = [
    // Tomates
    [1, 1, 800],  [1, 2, 900],  [1, 3, 750],  [1, 4, 700],  [1, 5, 750],  [1, 7, 1200], [1, 8, 1100],
    // Oignons
    [2, 1, 600],  [2, 3, 550],  [2, 4, 500],  [2, 5, 600],  [2, 7, 900],  [2, 8, 850],
    // Piments
    [3, 1, 300],  [3, 3, 250],  [3, 4, 250],  [3, 5, 300],
    // Gombo
    [4, 1, 400],  [4, 3, 350],  [4, 5, 400],
    // Aubergines
    [5, 1, 500],  [5, 3, 450],  [5, 4, 400],
    // Carottes
    [6, 1, 600],  [6, 7, 900],  [6, 8, 850],
    // Haricots verts
    [7, 1, 500],  [7, 7, 800],
    // Chou
    [8, 1, 300],  [8, 3, 250],  [8, 5, 300],  [8, 7, 500],
    // Bananes
    [9, 1, 500],  [9, 3, 450],  [9, 5, 500],  [9, 4, 400],
    // Ananas
    [10, 1, 400], [10, 3, 350], [10, 5, 400], [10, 6, 300],
    // Mangues
    [11, 1, 600], [11, 3, 500], [11, 4, 500],
    // Oranges
    [13, 1, 500], [13, 3, 450], [13, 5, 500],
    // Citrons
    [14, 1, 200], [14, 3, 150], [14, 5, 200],
    // Riz parfumé
    [15, 1, 2800], [15, 3, 2600], [15, 4, 2500], [15, 5, 2700], [15, 7, 3500], [15, 8, 3300], [15, 10, 3200],
    // Riz local
    [16, 1, 2200], [16, 3, 2000], [16, 4, 1900], [16, 5, 2000],
    // Farine
    [17, 1, 600],  [17, 7, 850],  [17, 8, 800],  [17, 10, 780],
    // Haricots secs
    [19, 1, 700],  [19, 3, 650],  [19, 4, 600],
    // Poulet
    [21, 1, 2500], [21, 3, 2300], [21, 4, 2200], [21, 5, 2400], [21, 7, 3200], [21, 10, 3000],
    // Poisson fumé
    [22, 1, 1500], [22, 3, 1400], [22, 5, 1500], [22, 6, 1300],
    // Thon boîte
    [23, 7, 650],  [23, 8, 600],  [23, 9, 580],  [23, 10, 620],
    // Sardines
    [24, 7, 350],  [24, 8, 320],  [24, 9, 300],
    // Bœuf
    [25, 1, 3500], [25, 3, 3200], [25, 4, 3000], [25, 7, 4500],
    // Lait concentré
    [27, 7, 650],  [27, 8, 620],  [27, 9, 600],  [27, 10, 640], [27, 11, 630],
    // Lait en poudre
    [28, 7, 2500], [28, 8, 2400], [28, 10, 2350],
    // Huile de palme
    [30, 1, 500],  [30, 3, 450],  [30, 4, 450],  [30, 5, 500],  [30, 7, 750],  [30, 8, 700],
    // Huile végétale
    [31, 7, 1200], [31, 8, 1150], [31, 9, 1100], [31, 10, 1180],
    // Sucre
    [32, 1, 450],  [32, 3, 400],  [32, 7, 650],  [32, 8, 620],  [32, 9, 600],
    // Sel
    [33, 1, 150],  [33, 3, 150],  [33, 7, 250],
    // Cube Maggi
    [34, 1, 100],  [34, 3, 100],  [34, 7, 150],  [34, 8, 150],
    // Tomate concentrée
    [35, 7, 250],  [35, 8, 230],  [35, 9, 220],
    // Eau minérale
    [36, 7, 500],  [36, 8, 450],  [36, 9, 400],  [36, 10, 480],
    // Savon Omo
    [39, 7, 700],  [39, 8, 680],  [39, 9, 650],  [39, 10, 680],
    // Savon de Marseille
    [40, 1, 300],  [40, 3, 250],  [40, 7, 450],
    // Dentifrice
    [41, 7, 1200], [41, 8, 1150], [41, 9, 1100],
    // Igname
    [42, 1, 600],  [42, 3, 550],  [42, 4, 500],  [42, 5, 550],
    // Manioc
    [43, 1, 300],  [43, 3, 250],  [43, 4, 250],  [43, 5, 300],
    // Banane plantain
    [44, 1, 600],  [44, 3, 550],  [44, 4, 500],  [44, 5, 600],
    // Patate douce
    [45, 1, 400],  [45, 3, 350],  [45, 5, 400],
    // Gingembre
    [46, 1, 500],  [46, 3, 450],  [46, 5, 500],
    // Ail
    [47, 1, 600],  [47, 3, 550],  [47, 5, 600],
  ];

  let count = 0;
  for (const [pid, sid, price] of prices) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO prices (product_id, store_id, user_id, price) VALUES (?,?,1,?)`,
      args: [pid, sid, price]
    });
    count++;
  }
  console.log(`✅ ${count} prix ajoutés`);
  console.log('\n🎉 Base de données remplie avec succès !');
  console.log('   Relancez le serveur avec npm start\n');
  process.exit(0);
}

seed().catch(err => { console.error('Erreur:', err); process.exit(1); });

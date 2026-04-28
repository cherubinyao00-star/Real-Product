const { createClient } = require('@libsql/client');
require('dotenv').config();

const db = createClient({ url: process.env.DB_URL || 'file:realproduct.db' });

async function initSchema() {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      email       TEXT    NOT NULL UNIQUE,
      password    TEXT    NOT NULL,
      role        TEXT    NOT NULL DEFAULT 'user',
      points      INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      name  TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS stores (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT NOT NULL,
      type         TEXT NOT NULL CHECK(type IN ('marche','supermarche','boutique')),
      city         TEXT NOT NULL DEFAULT 'Abidjan',
      neighborhood TEXT,
      lat          REAL,
      lng          REAL,
      created_by   INTEGER REFERENCES users(id),
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      category_id INTEGER REFERENCES categories(id),
      unit        TEXT NOT NULL DEFAULT 'unité',
      created_by  INTEGER REFERENCES users(id),
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS prices (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id  INTEGER NOT NULL REFERENCES products(id),
      store_id    INTEGER NOT NULL REFERENCES stores(id),
      user_id     INTEGER NOT NULL REFERENCES users(id),
      price       INTEGER NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS price_votes (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      price_id  INTEGER NOT NULL REFERENCES prices(id),
      user_id   INTEGER NOT NULL REFERENCES users(id),
      vote      INTEGER NOT NULL CHECK(vote IN (1,-1)),
      UNIQUE(price_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_prices_product  ON prices(product_id);
    CREATE INDEX IF NOT EXISTS idx_prices_store    ON prices(store_id);
    CREATE INDEX IF NOT EXISTS idx_prices_date     ON prices(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_products_name   ON products(name);
  `);

  // Seed categories
  await db.executeMultiple(`
    INSERT OR IGNORE INTO categories (name) VALUES ('Légumes');
    INSERT OR IGNORE INTO categories (name) VALUES ('Fruits');
    INSERT OR IGNORE INTO categories (name) VALUES ('Céréales & Féculents');
    INSERT OR IGNORE INTO categories (name) VALUES ('Viandes & Poissons');
    INSERT OR IGNORE INTO categories (name) VALUES ('Produits laitiers');
    INSERT OR IGNORE INTO categories (name) VALUES ('Huiles & Condiments');
    INSERT OR IGNORE INTO categories (name) VALUES ('Boissons');
    INSERT OR IGNORE INTO categories (name) VALUES ('Entretien & Hygiène');
  `);

  // Seed stores
  await db.executeMultiple(`
    INSERT OR IGNORE INTO stores (id, name, type, city, neighborhood, lat, lng) VALUES
      (1, 'Marché Adjamé', 'marche', 'Abidjan', 'Adjamé', 5.3610, -4.0165);
    INSERT OR IGNORE INTO stores (id, name, type, city, neighborhood, lat, lng) VALUES
      (2, 'Marché Cocody', 'marche', 'Abidjan', 'Cocody', 5.3540, -3.9920);
    INSERT OR IGNORE INTO stores (id, name, type, city, neighborhood, lat, lng) VALUES
      (3, 'Marché de Treichville', 'marche', 'Abidjan', 'Treichville', 5.2966, -4.0050);
    INSERT OR IGNORE INTO stores (id, name, type, city, neighborhood, lat, lng) VALUES
      (4, 'Carrefour Marcory', 'supermarche', 'Abidjan', 'Marcory', 5.2900, -3.9912);
    INSERT OR IGNORE INTO stores (id, name, type, city, neighborhood, lat, lng) VALUES
      (5, 'Sococé Abidjan', 'supermarche', 'Abidjan', 'Plateau', 5.3218, -4.0228);
    INSERT OR IGNORE INTO stores (id, name, type, city, neighborhood, lat, lng) VALUES
      (6, 'Leader Price Plateau', 'supermarche', 'Abidjan', 'Plateau', 5.3177, -4.0230);
  `);

  // Seed products
  await db.executeMultiple(`
    INSERT OR IGNORE INTO products (id, name, category_id, unit) VALUES (1,'Tomates rondes',1,'1 kg');
    INSERT OR IGNORE INTO products (id, name, category_id, unit) VALUES (2,'Huile de palme',6,'1 L');
    INSERT OR IGNORE INTO products (id, name, category_id, unit) VALUES (3,'Riz parfumé',3,'5 kg');
    INSERT OR IGNORE INTO products (id, name, category_id, unit) VALUES (4,'Poulet entier',4,'1 kg');
    INSERT OR IGNORE INTO products (id, name, category_id, unit) VALUES (5,'Sucre blanc',6,'1 kg');
    INSERT OR IGNORE INTO products (id, name, category_id, unit) VALUES (6,'Farine de blé',3,'1 kg');
    INSERT OR IGNORE INTO products (id, name, category_id, unit) VALUES (7,'Lait concentré',5,'410 g');
    INSERT OR IGNORE INTO products (id, name, category_id, unit) VALUES (8,'Savon Omo',8,'800 g');
  `);

  console.log('✅ Base de données initialisée');
}

module.exports = { db, initSchema };

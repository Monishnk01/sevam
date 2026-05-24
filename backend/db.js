const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Helper to wrap db.run in a Promise
function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

// Helper to wrap db.all in a Promise
function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Helper to wrap db.get in a Promise
function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Initialize tables
async function initDatabase() {
  try {
    // 1. Users
    await runAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT CHECK(role IN ('restaurant', 'distributor', 'receiver')) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Restaurants
    await runAsync(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        cuisine_type TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 3. Food Entries
    await runAsync(`
      CREATE TABLE IF NOT EXISTS food_entries (
        id TEXT PRIMARY KEY,
        restaurant_id TEXT NOT NULL,
        food_name TEXT NOT NULL,
        quantity_prepared REAL NOT NULL,
        quantity_remaining REAL NOT NULL,
        date TEXT NOT NULL, -- YYYY-MM-DD
        time_slot TEXT DEFAULT 'dinner',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
      )
    `);

    // 4. Predictions
    await runAsync(`
      CREATE TABLE IF NOT EXISTS predictions (
        id TEXT PRIMARY KEY,
        restaurant_id TEXT NOT NULL,
        food_name TEXT NOT NULL,
        prediction_date TEXT NOT NULL, -- YYYY-MM-DD
        predicted_leftover REAL NOT NULL,
        predicted_waste REAL NOT NULL,
        accuracy REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
      )
    `);

    // 5. Donations
    await runAsync(`
      CREATE TABLE IF NOT EXISTS donations (
        id TEXT PRIMARY KEY,
        restaurant_id TEXT NOT NULL,
        food_name TEXT NOT NULL,
        quantity REAL NOT NULL,
        expiry_time DATETIME NOT NULL,
        status TEXT CHECK(status IN ('pending', 'assigned', 'picked_up', 'delivered', 'cancelled')) DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
      )
    `);

    // 6. Receivers
    await runAsync(`
      CREATE TABLE IF NOT EXISTS receivers (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        capacity REAL NOT NULL,
        capacity_used REAL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 7. Pickups
    await runAsync(`
      CREATE TABLE IF NOT EXISTS pickups (
        id TEXT PRIMARY KEY,
        donation_id TEXT NOT NULL,
        distributor_id TEXT NOT NULL,
        receiver_id TEXT NOT NULL,
        status TEXT CHECK(status IN ('assigned', 'picked_up', 'delivered')) DEFAULT 'assigned',
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE,
        FOREIGN KEY (distributor_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES receivers(id) ON DELETE CASCADE
      )
    `);

    console.log('All database tables initialized successfully.');
  } catch (error) {
    console.error('Error initializing database tables:', error);
  }
}

module.exports = {
  db,
  runAsync,
  allAsync,
  getAsync,
  initDatabase,
};

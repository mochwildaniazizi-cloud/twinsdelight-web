const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;

let pool;
let dbConnected = false;

async function initDB() {
  try {
    // 1. Connect without database first to ensure it exists
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      connectTimeout: 4000
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'twinsdelight'}\``);
    await connection.end();

    // 2. Create pool for database
    pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'twinsdelight',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 4000
    });

    // 3. Create orders table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        address TEXT NOT NULL,
        date VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Menunggu',
        boxesDetail JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    dbConnected = true;
    console.log('MySQL Database & Table initialized successfully.');
  } catch (err) {
    dbConnected = false;
    console.warn('\n================================================================');
    console.warn(`[WARNING] Failed to connect to MySQL: ${err.message}`);
    console.warn('The Express server will run in OFFLINE mode (using localStorage on client).');
    console.warn('Please ensure MySQL is running on the port configured in .env.');
    console.warn('================================================================\n');
  }
}

// GET all orders
app.get('/api/orders', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Database connection offline. Using local cache.' });
  }
  try {
    const [rows] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    const formatted = rows.map(row => {
      let boxesDetail = row.boxesDetail;
      if (typeof boxesDetail === 'string') {
        try {
          boxesDetail = JSON.parse(boxesDetail);
        } catch (_) {}
      }
      return { ...row, boxesDetail };
    });
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new order
app.post('/api/orders', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Database connection offline.' });
  }
  const { id, name, phone, address, date, status, boxesDetail } = req.body;
  try {
    const jsonStr = JSON.stringify(boxesDetail);
    await pool.query(
      'INSERT INTO orders (id, name, phone, address, date, status, boxesDetail) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, phone, address, date, status || 'Menunggu', jsonStr]
    );
    res.status(201).json({ id, name, phone, address, date, status, boxesDetail });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update order status or details
app.put('/api/orders/:id', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Database connection offline.' });
  }
  const { id } = req.params;
  const { name, phone, address, date, status, boxesDetail } = req.body;
  try {
    let query = 'UPDATE orders SET ';
    const params = [];
    const updates = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
    if (address !== undefined) { updates.push('address = ?'); params.push(address); }
    if (date !== undefined) { updates.push('date = ?'); params.push(date); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (boxesDetail !== undefined) {
      updates.push('boxesDetail = ?');
      params.push(JSON.stringify(boxesDetail));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    query += updates.join(', ') + ' WHERE id = ?';
    params.push(id);

    await pool.query(query, params);
    res.json({ message: 'Order updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE order
app.delete('/api/orders/:id', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Database connection offline.' });
  }
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM orders WHERE id = ?', [id]);
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Initialize database and start listening
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
});

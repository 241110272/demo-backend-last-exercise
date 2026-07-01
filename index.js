require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// MySQL Connection Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Initialize Database
async function initializeDatabase() {
    try {
        const connection = await pool.getConnection();

        // Create table if not exists
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS quotes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        text VARCHAR(500) NOT NULL,
        author VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Check if quotes already exist
        const [rows] = await connection.execute('SELECT COUNT(*) as count FROM quotes');

        if (rows[0].count === 0) {
            // Load quotes from JSON file
            const quotesPath = path.join(__dirname, 'quotes.json');
            const quotesData = JSON.parse(fs.readFileSync(quotesPath, 'utf8'));

            // Insert quotes
            for (const quote of quotesData) {
                await connection.execute(
                    'INSERT INTO quotes (id, text, author, created_at) VALUES (?, ?, ?, ?)',
                    [quote.id, quote.text, quote.author, quote.created_at]
                );
            }
            console.log(`✓ Inserted ${quotesData.length} quotes into database`);
        }

        connection.release();
        console.log('✓ Database initialized successfully');
    } catch (error) {
        console.error('✗ Database initialization error:', error);
        process.exit(1);
    }
}

// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Express-MySQL API on Railway!'
    });
});

app.get('/quotes', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint: return 9 random quotes
app.get('/api/quotes/', async (req, res) => {
    try {
        const connection = await pool.getConnection();

        // Get 9 random quotes
        const [quotes] = await connection.execute(`
            SELECT id, text, author, created_at FROM quotes ORDER BY RAND() LIMIT 9
        `);

        connection.release();

        res.json(quotes);
    } catch (error) {
        console.error('Error fetching quotes:', error);
        res.status(500).json({
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, async () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    await initializeDatabase();
});

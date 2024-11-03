// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MySQL connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true // Enable multiple statements
});

// Connect to MySQL
db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
    
    // Create table if it doesn't exist
    const createTables = [
        `CREATE TABLE IF NOT EXISTS fnb (
            fnb_id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            type VARCHAR(100) NOT NULL,
            price DECIMAL(10, 2) NOT NULL
        )`,
        
        `CREATE TABLE IF NOT EXISTS menu (
            menu_id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            is_vegetarian BOOLEAN DEFAULT FALSE,
            price DECIMAL(10, 2) NOT NULL
        )`,
        
        `CREATE TABLE IF NOT EXISTS menu_fnb (
            menu_id INT,
            fnb_id INT,
            PRIMARY KEY (menu_id, fnb_id),
            FOREIGN KEY (menu_id) REFERENCES menu(menu_id),
            FOREIGN KEY (fnb_id) REFERENCES fnb(fnb_id)
        )`,
        
        `CREATE TABLE IF NOT EXISTS orders (
            order_id INT AUTO_INCREMENT PRIMARY KEY,
            customer_id INT,
            delivery_option VARCHAR(50) NOT NULL,
            order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            status VARCHAR(50) NOT NULL
        )`,
        
        `CREATE TABLE IF NOT EXISTS order_menu (
            order_id INT,
            menu_id INT,
            quantity INT NOT NULL DEFAULT 1,
            PRIMARY KEY (order_id, menu_id),
            FOREIGN KEY (order_id) REFERENCES orders(order_id),
            FOREIGN KEY (menu_id) REFERENCES menu(menu_id)
        )`,
        
        `CREATE TABLE IF NOT EXISTS delivery (
            delivery_id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT UNIQUE,
            delivery_date DATETIME,
            delivery_status VARCHAR(50) NOT NULL,
            carrier VARCHAR(100),
            FOREIGN KEY (order_id) REFERENCES orders(order_id)
        )`,
        
        `CREATE TABLE IF NOT EXISTS review (
            review_id INT AUTO_INCREMENT PRIMARY KEY,
            customer_id INT,
            order_id INT UNIQUE,
            rating INT NOT NULL,
            comment TEXT,
            FOREIGN KEY (order_id) REFERENCES orders(order_id)
        )`,
        
        `CREATE TABLE IF NOT EXISTS payment (
            payment_id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT UNIQUE,
            payment_method VARCHAR(50) NOT NULL,
            payment_status VARCHAR(50) NOT NULL,
            payment_date DATETIME,
            amount DECIMAL(10, 2) NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(order_id)
        )`
    ];
    
    createTables.forEach((query) => {
        db.query(query, (err) => {
            if (err) {
                console.error('Error creating table:', err);
            } else {
                console.log('Table created or already exists');
            }
        });
    });
});

// FnB Routes
app.get('/api/fnb', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM fnb');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching FnB:', error);
        res.status(500).json({ error: 'Error fetching FnB items' });
    }
});

app.post('/api/fnb', async (req, res) => {
    const { name, type, price } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO fnb (name, type, price) VALUES (?, ?, ?)',
            [name, type, price]
        );
        res.status(201).json({ id: result.insertId, name, type, price });
    } catch (error) {
        console.error('Error creating FnB:', error);
        res.status(500).json({ error: 'Error creating FnB item' });
    }
});

// Menu Routes
app.get('/api/menu', async (req, res) => {
    try {
        const [menus] = await pool.query('SELECT * FROM menu');
        for (let menu of menus) {
            const [fnbs] = await pool.query(
                `SELECT f.* FROM fnb f 
                JOIN menu_fnb mf ON f.fnb_id = mf.fnb_id 
                WHERE mf.menu_id = ?`,
                [menu.menu_id]
            );
            menu.fnbs = fnbs;
        }
        res.json(menus);
    } catch (error) {
        console.error('Error fetching menus:', error);
        res.status(500).json({ error: 'Error fetching menus' });
    }
});

app.post('/api/menu', async (req, res) => {
    const { name, is_vegetarian, price, fnb_ids } = req.body;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        
        const [menuResult] = await conn.query(
            'INSERT INTO menu (name, is_vegetarian, price) VALUES (?, ?, ?)',
            [name, is_vegetarian, price]
        );
        
        const menu_id = menuResult.insertId;
        
        // Add FnB associations
        for (let fnb_id of fnb_ids) {
            await conn.query(
                'INSERT INTO menu_fnb (menu_id, fnb_id) VALUES (?, ?)',
                [menu_id, fnb_id]
            );
        }
        
        await conn.commit();
        res.status(201).json({ 
            menu_id,
            name,
            is_vegetarian,
            price,
            fnb_ids
        });
    } catch (error) {
        await conn.rollback();
        console.error('Error creating menu:', error);
        res.status(500).json({ error: 'Error creating menu' });
    } finally {
        conn.release();
    }
});

// Order Routes
app.post('/api/orders', async (req, res) => {
    const { customer_id, delivery_option, menu_items } = req.body;
    const conn = await pool.getConnection();
    
    try {
        await conn.beginTransaction();
        
        const [orderResult] = await conn.query(
            'INSERT INTO orders (customer_id, delivery_option, status) VALUES (?, ?, ?)',
            [customer_id, delivery_option, 'PENDING']
        );
        
        const order_id = orderResult.insertId;
        
        // Add menu items to order
        for (let item of menu_items) {
            await conn.query(
                'INSERT INTO order_menu (order_id, menu_id, quantity) VALUES (?, ?, ?)',
                [order_id, item.menu_id, item.quantity]
            );
        }
        
        // Create associated delivery record
        if (delivery_option !== 'pickup') {
            await conn.query(
                'INSERT INTO delivery (order_id, delivery_status) VALUES (?, ?)',
                [order_id, 'PENDING']
            );
        }
        
        await conn.commit();
        res.status(201).json({ order_id });
    } catch (error) {
        await conn.rollback();
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Error creating order' });
    } finally {
        conn.release();
    }
});

// Payment Routes
app.post('/api/payments', async (req, res) => {
    const { order_id, payment_method, amount } = req.body;
    try {
        const [result] = await pool.query(
            `INSERT INTO payment (order_id, payment_method, payment_status, payment_date, amount) 
             VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)`,
            [order_id, payment_method, 'PENDING', amount]
        );
        res.status(201).json({ payment_id: result.insertId });
    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({ error: 'Error creating payment' });
    }
});

// Review Routes
app.post('/api/reviews', async (req, res) => {
    const { order_id, customer_id, rating, comment } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO review (order_id, customer_id, rating, comment) VALUES (?, ?, ?, ?)',
            [order_id, customer_id, rating, comment]
        );
        res.status(201).json({ review_id: result.insertId });
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ error: 'Error creating review' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
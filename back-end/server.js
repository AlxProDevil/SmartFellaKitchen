const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Create and export pool for use throughout the application
let pool;

async function initializePool() {
    try {
        pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        // Test the connection
        await pool.getConnection();
        console.log('Database connection established successfully');
        return pool;
    } catch (error) {
        console.error('Error initializing database pool:', error);
        process.exit(1);
    }
}

// Initialize database tables
async function initDatabase() {
    try {
        await initializePool(); // Make sure pool is initialized first
        
        const createTables = [
            `CREATE TABLE IF NOT EXISTS fnb (
                fnb_id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(100) NOT NULL,
                price INT NOT NULL
            )`,
            
            `CREATE TABLE IF NOT EXISTS menu (
                menu_id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                is_vegetarian BOOLEAN DEFAULT FALSE,
                price INT NOT NULL
            )`,
            
            `CREATE TABLE IF NOT EXISTS menu_fnb (
                menu_id INT,
                fnb_id INT,
                quantity INT NOT NULL DEFAULT 1,
                PRIMARY KEY (menu_id, fnb_id),
                FOREIGN KEY (menu_id) REFERENCES menu(menu_id),
                FOREIGN KEY (fnb_id) REFERENCES fnb(fnb_id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS orders (
                order_id INT AUTO_INCREMENT PRIMARY KEY,
                customer_id INT,
                delivery_option VARCHAR(50) NOT NULL,
                order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(50) NOT NULL,
                total_amount INT NOT NULL
            )`,
            
            `CREATE TABLE IF NOT EXISTS order_menu (
                order_id INT,
                menu_id INT,
                quantity INT NOT NULL DEFAULT 1,
                PRIMARY KEY (order_id, menu_id),
                FOREIGN KEY (order_id) REFERENCES orders(order_id),
                FOREIGN KEY (menu_id) REFERENCES menu(menu_id)
            )`
        ];

        for (const query of createTables) {
            await pool.query(query);
        }
        console.log('Database tables initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

// Initialize database on startup
initDatabase().catch(console.error);

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
            [name, type, parseInt(price)]
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
                `SELECT f.*, mf.quantity FROM fnb f 
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
    const { name, is_vegetarian, price, fnb_items } = req.body;
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const [menuResult] = await connection.query(
            'INSERT INTO menu (name, is_vegetarian, price) VALUES (?, ?, ?)',
            [name, is_vegetarian, parseInt(price)]
        );
        
        const menu_id = menuResult.insertId;
        
        // Add FnB associations with quantities
        for (let item of fnb_items) {
            await connection.query(
                'INSERT INTO menu_fnb (menu_id, fnb_id, quantity) VALUES (?, ?, ?)',
                [menu_id, item.fnb_id, item.quantity]
            );
        }
        
        await connection.commit();
        res.status(201).json({ 
            menu_id,
            name,
            is_vegetarian,
            price,
            fnb_items
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating menu:', error);
        res.status(500).json({ error: 'Error creating menu' });
    } finally {
        connection.release();
    }
});

// Order Routes
app.get('/api/orders', async (req, res) => {
    try {
        const [orders] = await pool.query(`
            SELECT o.*, 
                   GROUP_CONCAT(m.name) as menu_names,
                   GROUP_CONCAT(om.quantity) as quantities
            FROM orders o
            LEFT JOIN order_menu om ON o.order_id = om.order_id
            LEFT JOIN menu m ON om.menu_id = m.menu_id
            GROUP BY o.order_id
            ORDER BY o.order_date DESC
        `);
        
        // Process the results to create a more structured response
        const processedOrders = orders.map(order => ({
            ...order,
            menu_names: order.menu_names ? order.menu_names.split(',') : [],
            quantities: order.quantities ? order.quantities.split(',').map(Number) : []
        }));
        
        res.json(processedOrders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Error fetching orders' });
    }
});

app.post('/api/orders', async (req, res) => {
    const { customer_id, delivery_option, menu_items } = req.body;
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Calculate total amount
        let total_amount = 0;
        for (let item of menu_items) {
            const [menuPrice] = await connection.query(
                'SELECT price FROM menu WHERE menu_id = ?',
                [item.menu_id]
            );
            total_amount += menuPrice[0].price * item.quantity;
        }
        
        const [orderResult] = await connection.query(
            'INSERT INTO orders (customer_id, delivery_option, status, total_amount) VALUES (?, ?, ?, ?)',
            [customer_id, delivery_option, 'PENDING', total_amount]
        );
        
        const order_id = orderResult.insertId;
        
        for (let item of menu_items) {
            await connection.query(
                'INSERT INTO order_menu (order_id, menu_id, quantity) VALUES (?, ?, ?)',
                [order_id, item.menu_id, item.quantity]
            );
        }
        
        await connection.commit();
        res.status(201).json({ 
            order_id,
            total_amount,
            status: 'PENDING'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Error creating order' });
    } finally {
        connection.release();
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
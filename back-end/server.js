const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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
        await initializePool();
        
        createTables = [
            `CREATE TABLE IF NOT EXISTS users (
                user_id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'user',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

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
                address VARCHAR(255),
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
            )`,
            
            `CREATE TABLE IF NOT EXISTS delivery (
                delivery_id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT UNIQUE,
                address VARCHAR(255), 
                status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
                FOREIGN KEY (order_id) REFERENCES orders(order_id)
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

initDatabase().catch(console.error);

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    try {
        // Check if user already exists
        const [existingUsers] = await pool.query(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, email]
        );
        
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const [result] = await pool.query(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );
        
        // Generate JWT token
        const token = jwt.sign(
            { userId: result.insertId, username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                userId: result.insertId,
                username,
                email
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Error registering user' });
    }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        // Find user
        const [users] = await pool.query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = users[0];
        
        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.user_id, 
                username: user.username,
                role: user.role // Include role in the token
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            token,
            user: {
                userId: user.user_id,
                username: user.username,
                email: user.email,
                role: user.role // Include role in the response
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Error logging in' });
    }
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access denied' });
    }
    
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.status(403).json({ error: 'Invalid token' });
    }
};

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
        let query = `
            SELECT o.*, 
                   GROUP_CONCAT(m.name) as menu_names,
                   GROUP_CONCAT(om.quantity) as quantities
            FROM orders o
            LEFT JOIN order_menu om ON o.order_id = om.order_id
            LEFT JOIN menu m ON om.menu_id = m.menu_id
        `;
        
        const params = [];
        if (req.query.customer_id) {
            query += ' WHERE o.customer_id = ?';
            params.push(req.query.customer_id);
        }
        
        query += `
            GROUP BY o.order_id
            ORDER BY o.order_date DESC
        `;
        
        const [orders] = await pool.query(query, params);
        
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

// Order Routes
app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        // Get user role from JWT token
        const userRole = req.user.role;
        const userId = req.user.userId;
        
        let query = `
        SELECT o.*, 
                GROUP_CONCAT(m.name) as menu_names,
                GROUP_CONCAT(om.quantity) as quantities
        FROM orders o
        LEFT JOIN order_menu om ON o.order_id = om.order_id
        LEFT JOIN menu m ON om.menu_id = m.menu_id
        `;
        
        const params = [];
        
        // If user role is 'user', only show their orders
        if (userRole === 'user') {
        query += ' WHERE o.customer_id = ?';
        params.push(userId);
        }
        // For admin/staff, show all orders (no WHERE clause needed)
        
        query += `
        GROUP BY o.order_id
        ORDER BY o.order_date DESC
        `;
        
        const [orders] = await pool.query(query, params);
        
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

// Delivery Routes
app.get('/api/delivery', async (req, res) => {
    try {
        const [deliveries] = await pool.query(`
            SELECT d.delivery_id, d.order_id, d.address, d.status, 
                   GROUP_CONCAT(m.name) as menu_names
            FROM delivery d
            JOIN orders o ON d.order_id = o.order_id
            LEFT JOIN order_menu om ON o.order_id = om.order_id
            LEFT JOIN menu m ON om.menu_id = m.menu_id
            GROUP BY d.delivery_id
            ORDER BY d.delivery_id DESC
        `);
        res.json(deliveries);
    } catch (error) {
        console.error('Error fetching deliveries:', error);
        res.status(500).json({ error: 'Error fetching deliveries' });
    }
});

app.put('/api/delivery/:order_id', async (req, res) => {
    const { status } = req.body;
    const { order_id } = req.params;
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Update delivery status
        await connection.query(
            'UPDATE delivery SET status = ? WHERE order_id = ?',
            [status, order_id]
        );
        
        // Update order status
        await connection.query(
            'UPDATE orders SET status = ? WHERE order_id = ?',
            [status, order_id]
        );
        
        await connection.commit();
        res.json({ success: true });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating delivery status:', error);
        res.status(500).json({ error: 'Error updating delivery status' });
    } finally {
        connection.release();
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
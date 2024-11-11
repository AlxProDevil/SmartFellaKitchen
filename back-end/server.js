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

            `CREATE TABLE IF NOT EXISTS order_fnb (
                order_id INT,
                fnb_id INT,
                quantity INT NOT NULL DEFAULT 1,
                PRIMARY KEY (order_id, fnb_id),
                FOREIGN KEY (order_id) REFERENCES orders(order_id),
                FOREIGN KEY (fnb_id) REFERENCES fnb(fnb_id)
            );`,
            
            `CREATE TABLE IF NOT EXISTS delivery (
                delivery_id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT UNIQUE,
                address VARCHAR(255), 
                status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
                FOREIGN KEY (order_id) REFERENCES orders(order_id)
            )`,

            `CREATE TABLE IF NOT EXISTS reviews (
                review_id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT UNIQUE,
                rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
                comment TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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

app.delete('/api/menu/:menu_id', async (req, res) => {
    const { menu_id } = req.params;
    const connection = await pool.getConnection();
  
    try {
      await connection.beginTransaction();
  
      // First, delete any records in order_menu that reference the menu_id
      await connection.query('DELETE FROM order_menu WHERE menu_id = ?', [menu_id]);
  
      // Then, delete associations in menu_fnb table
      await connection.query('DELETE FROM menu_fnb WHERE menu_id = ?', [menu_id]);
  
      // Finally, delete the menu item
      await connection.query('DELETE FROM menu WHERE menu_id = ?', [menu_id]);
  
      await connection.commit();
      res.status(200).json({ message: 'Menu deleted successfully' });
    } catch (error) {
      await connection.rollback();
      console.error('Error deleting menu:', error);
      res.status(500).json({ error: 'Error deleting menu' });
    } finally {
      connection.release();
    }
  });

  app.put('/api/menu/:menu_id', async (req, res) => {
    const { menu_id } = req.params;
    const { name, is_vegetarian, price, fnb_items } = req.body;
    const connection = await pool.getConnection();
  
    try {
      await connection.beginTransaction();
  
      // Update the menu details
      await connection.query(
        'UPDATE menu SET name = ?, is_vegetarian = ?, price = ? WHERE menu_id = ?',
        [name, is_vegetarian, price, menu_id]
      );
  
      // Delete existing fnb associations and reinsert updated quantities
      await connection.query('DELETE FROM menu_fnb WHERE menu_id = ?', [menu_id]);
  
      for (const item of fnb_items) {
        await connection.query(
          'INSERT INTO menu_fnb (menu_id, fnb_id, quantity) VALUES (?, ?, ?)',
          [menu_id, item.fnb_id, item.quantity]
        );
      }
  
      await connection.commit();
      res.status(200).json({ message: 'Menu updated successfully' });
    } catch (error) {
      await connection.rollback();
      console.error('Error updating menu:', error);
      res.status(500).json({ error: 'Error updating menu' });
    } finally {
      connection.release();
    }
  });
  

// Order Routes
app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        // Get the user ID and role from the authenticated token
        const { userId, role } = req.user;
        
        let orders;
        
        if (role === 'admin') {
            // Admin can see all orders
            [orders] = await pool.query(`
                SELECT o.*, u.username as customer_name 
                FROM orders o
                JOIN users u ON o.customer_id = u.user_id
                ORDER BY order_date DESC
            `);
        } else {
            // Regular users can only see their own orders
            [orders] = await pool.query(`
                SELECT o.*, u.username as customer_name 
                FROM orders o
                JOIN users u ON o.customer_id = u.user_id
                WHERE customer_id = ?
                ORDER BY order_date DESC
            `, [userId]);
        }

        // For each order, fetch menu items and fnb items
        for (let order of orders) {
            // Get menu items
            const [menuItems] = await pool.query(`
                SELECT m.name, m.price, om.quantity
                FROM order_menu om
                JOIN menu m ON om.menu_id = m.menu_id
                WHERE om.order_id = ?
            `, [order.order_id]);

            // Get fnb items
            const [fnbItems] = await pool.query(`
                SELECT f.name, f.price, of.quantity
                FROM order_fnb of
                JOIN fnb f ON of.fnb_id = f.fnb_id
                WHERE of.order_id = ?
            `, [order.order_id]);

            // Combine all items
            order.items = [...menuItems, ...fnbItems];
        }
        
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Error fetching orders' });
    }
});

app.post('/api/orders', async (req, res) => {
    const { customer_id, delivery_option, address, menu_items, fnb_items } = req.body;
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Calculate total amount
        let total_amount = 0;
        
        // Calculate menu items total
        for (let item of menu_items || []) {
            const [menuPrice] = await connection.query(
                'SELECT price FROM menu WHERE menu_id = ?',
                [item.menu_id]
            );
            if (menuPrice[0]) {
                total_amount += menuPrice[0].price * item.quantity;
            }
        }
        
        // Calculate FnB items total
        for (let item of fnb_items || []) {
            const [fnbPrice] = await connection.query(
                'SELECT price FROM fnb WHERE fnb_id = ?',
                [item.fnb_id]
            );
            if (fnbPrice[0]) {
                total_amount += fnbPrice[0].price * item.quantity;
            }
        }
        
        // Create order
        const [orderResult] = await connection.query(
            'INSERT INTO orders (customer_id, delivery_option, address, status, total_amount) VALUES (?, ?, ?, ?, ?)',
            [customer_id, delivery_option, address, 'PENDING', total_amount]
        );
        
        const order_id = orderResult.insertId;
        
        // Insert menu items
        if (menu_items && menu_items.length > 0) {
            for (let item of menu_items) {
                await connection.query(
                    'INSERT INTO order_menu (order_id, menu_id, quantity) VALUES (?, ?, ?)',
                    [order_id, item.menu_id, item.quantity]
                );
            }
        }
        
        // Insert FnB items
        if (fnb_items && fnb_items.length > 0) {
            for (let item of fnb_items) {
                await connection.query(
                    'INSERT INTO order_fnb (order_id, fnb_id, quantity) VALUES (?, ?, ?)',
                    [order_id, item.fnb_id, item.quantity]
                );
            }
        }

        if (delivery_option === 'delivery' || delivery_option === 'pickup') {
            await connection.query(
                'INSERT INTO delivery (order_id, address, status) VALUES (?, ?, ?)',
                [order_id, address, 'PENDING']
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

// Delivery Routes
app.get('/api/delivery', async (req, res) => {
    try {
        const [deliveries] = await pool.query(`
            SELECT 
                d.delivery_id,
                d.order_id,
                d.address,
                d.status,
                o.total_amount,
                o.order_date,
                GROUP_CONCAT(DISTINCT 
                    CASE 
                        WHEN m.name IS NOT NULL THEN CONCAT(m.name, ' (', om.quantity, ')')
                        WHEN f.name IS NOT NULL THEN CONCAT(f.name, ' (', of.quantity, ')')
                    END
                    SEPARATOR ', '
                ) as items
            FROM delivery d
            JOIN orders o ON d.order_id = o.order_id
            LEFT JOIN order_menu om ON o.order_id = om.order_id
            LEFT JOIN menu m ON om.menu_id = m.menu_id
            LEFT JOIN order_fnb of ON o.order_id = of.order_id
            LEFT JOIN fnb f ON of.fnb_id = f.fnb_id
            GROUP BY d.delivery_id, d.order_id, d.address, d.status, o.total_amount, o.order_date
            ORDER BY o.order_date DESC
        `);

        // Format the response
        const formattedDeliveries = deliveries.map(delivery => ({
            delivery_id: delivery.delivery_id,
            order_id: delivery.order_id,
            address: delivery.address,
            status: delivery.status,
            total_amount: delivery.total_amount,
            order_date: delivery.order_date,
            items: delivery.items ? delivery.items.split(', ') : []
        }));

        res.json(formattedDeliveries);
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

// Get all reviews
app.get('/api/reviews', async (req, res) => {
    try {
        const [reviews] = await pool.query(`
            SELECT r.*, o.customer_id, o.order_date 
            FROM reviews r
            JOIN orders o ON r.order_id = o.order_id
            ORDER BY r.created_at DESC
        `);
        res.json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Error fetching reviews' });
    }
});

// Get review by order ID
app.get('/api/reviews/:orderId', async (req, res) => {
    try {
        const [review] = await pool.query(
            'SELECT * FROM reviews WHERE order_id = ?',
            [req.params.orderId]
        );
        res.json(review[0] || null);
    } catch (error) {
        console.error('Error fetching review:', error);
        res.status(500).json({ error: 'Error fetching review' });
    }
});

// Create review
app.post('/api/reviews', async (req, res) => {
    const { order_id, rating, comment } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO reviews (order_id, rating, comment) VALUES (?, ?, ?)',
            [order_id, rating, comment]
        );
        res.status(201).json({ 
            review_id: result.insertId,
            order_id,
            rating,
            comment
        });
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ error: 'Error creating review' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
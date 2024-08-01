const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public')); // Assuming you put your HTML and JS files in a folder named 'public'

// MySQL connection
const db = mysql.createConnection({
    host: '127.0.0.1', // XAMPP runs MySQL on localhost
    user: 'root', // Default user for XAMPP MySQL
    password: '', // Default password for XAMPP MySQL (usually empty)
    database: 'hr_system' // Your database name
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to database');
});

// Middleware for session handling
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using https
}));

// Middleware to check if user is authenticated and their role
function checkAuth(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
}

function checkAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Forbidden' });
    }
}

// User registration
app.post('/api/register', async (req, res) => {
    const { username, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    db.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, role], (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ success: true });
        }
    });
});

// User signup
app.post('/api/signup', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
    db.query(query, [username, hashedPassword, 'user'], (err, result) => {
        if (err) {
            return res.json({ success: false, message: 'Error signing up' });
        }
        res.json({ success: true, message: 'User registered successfully' });
    });
});

// User login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (results.length === 0) {
            res.status(401).json({ error: 'Invalid username or password' });
        } else {
            const user = results[0];
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                req.session.user = { id: user.id, role: user.role };
                res.json({ success: true });
            } else {
                res.status(401).json({ error: 'Invalid username or password' });
            }
        }
    });
});

// Check user role
app.get('/api/checkUserRole', checkAuth, (req, res) => {
    res.json({ role: req.session.user.role });
});

// Check leave status
app.get('/api/checkLeaveStatus', checkAuth, (req, res) => {
    const userId = req.session.user.id;
    db.query('SELECT status FROM leave_status WHERE user_id = ?', [userId], (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ status: results[0].status });
        }
    });
});

// Check off days
app.get('/api/checkOffDays', checkAuth, (req, res) => {
    const userId = req.session.user.id;
    db.query('SELECT off_days FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ offDays: results[0].off_days });
        }
    });
});

// Request leave
app.post('/api/requestLeave', checkAuth, (req, res) => {
    const userId = req.session.user.id;
    const date = req.body.date;
    db.query('INSERT INTO leave_requests (user_id, date) VALUES (?, ?)', [userId, date], (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ success: true });
        }
    });
});

// Add leave status for a user (Admin only)
app.post('/api/addLeaveStatus', checkAdmin, (req, res) => {
    const { userId, status } = req.body;
    db.query('INSERT INTO leave_status (user_id, status) VALUES (?, ?)', [userId, status], (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ success: true });
        }
    });
});

// Add off days for a user (Admin only)
app.post('/api/addOffDays', checkAdmin, (req, res) => {
    const { userId, offDays } = req.body;
    db.query('UPDATE users SET off_days = off_days + ? WHERE id = ?', [offDays, userId], (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ success: true });
        }
    });
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ success: true });
        }
    });
});

// Start server
app.listen(3000, () => {
    console.log('Server started on port 3000');
});
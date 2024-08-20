const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const session = require('express-session');

const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static('public'));

// Middleware for logging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// MySQL connection
const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'hr_system',
    debug: true
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to database');
});

// Middleware for session handling
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
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

// User signup
app.post('/api/signup', async (req, res) => {
    const { username, password, role } = req.body;
    console.log('Signing up user:', username, role); // Debug log
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Hashed Password:', hashedPassword); // Debug log

        const query = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
        db.query(query, [username, hashedPassword, role], (err, result) => {
            if (err) {
                console.error('Error signing up user:', err.message); // Debug log
                return res.status(500).json({ success: false, message: 'Error signing up' });
            }
            res.json({ success: true, message: 'User registered successfully' });
        });
    } catch (err) {
        console.error('Error hashing password:', err.message); // Debug log
        res.status(500).json({ success: false, message: 'Error signing up' });
    }
});

// User login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    console.log('Logging in user:', username); // Debug log
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err) {
            console.error('Error fetching user:', err.message); // Debug log
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
app.get('/api/checkLeaveStatus', checkAuth, async (req, res) => {
    const userId = req.session.user.id;
    try {
        db.query('SELECT status FROM leave_status WHERE user_id = ?', [userId], (err, results) => {
            if (err) {
                console.error('Error fetching leave status:', err.message); // Debug log
                return res.status(500).json({ error: 'Error fetching leave status' });
            }
            if (results.length > 0) {
                res.json({ status: results[0].status });
            } else {
                res.status(404).json({ error: 'No leave status found' });
            }
        });
    } catch (err) {
        console.error('Error:', err.message); // Debug log
        res.status(500).json({ error: 'Server error' });
    }
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
app.post('/api/addLeaveStatus', checkAdmin, async (req, res) => {
    const { userId, status } = req.body;
    try {
        db.query('INSERT INTO leave_status (user_id, status) VALUES (?, ?)', [userId, status], (err, results) => {
            if (err) {
                console.error('Error adding leave status:', err.message); // Debug log
                return res.status(500).json({ error: 'Error adding leave status' });
            }
            res.json({ success: true });
        });
    } catch (err) {
        console.error('Error:', err.message); // Debug log
        res.status(500).json({ error: 'Server error' });
    }
});
// Add off days for a user (Admin only)
app.post('/api/addOffDays', checkAdmin, async (req, res) => {
    const { userId, offDays } = req.body;
    try {
        db.query('UPDATE users SET off_days = off_days + ? WHERE id = ?', [offDays, userId], (err, results) => {
            if (err) {
                console.error('Error adding off days:', err.message); // Debug log
                return res.status(500).json({ error: 'Error adding off days' });
            }
            res.json({ success: true });
        });
    } catch (err) {
        console.error('Error:', err.message); // Debug log
        res.status(500).json({ error: 'Server error' });
    }
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
app.listen(5500, () => {
    console.log('Server started on port 5500');
});
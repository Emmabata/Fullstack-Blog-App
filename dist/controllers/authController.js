const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

// GET: Signup Page
exports.showSignup = (req, res) => {
    res.render('signup', { error: null });
};

// POST: Handle Signup
exports.signup = async (req, res) => {
    const { first_name, last_name, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).render('signup', { error: 'Email already exists' });
        await User.create({ first_name, last_name, email, password });
        res.redirect('/login');
    } catch (err) {
        res.status(500).render('signup', { error: 'Registration failed. Try again.' });
    }
};

// GET: Login Page
exports.showLogin = (req, res) => {
    res.render('login', { error: null });
};

// POST: Handle Login
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !(await user.matchPassword(password))) {
            return res.status(400).render('login', { error: 'Invalid credentials' });
        }
        req.session.userId = user._id; // <-- Save userId in session
        res.redirect('/blogs/home');
    } catch (err) {
        res.status(500).render('login', { error: 'Login failed. Try again.' });
    }
};

// GET: Logout (optional)
exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/blogs/home');
    });
};

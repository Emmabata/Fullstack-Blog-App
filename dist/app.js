require('dotenv').config();
const express = require('express');
const session = require('express-session'); // <-- ADD THIS
const path = require('path');
const app = express();
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const connectDB = require('./config/db');
const PORT = process.env.PORT || 3000;

// ======= Connect to MongoDB ======= //
connectDB();

// ======= Middleware ======= //
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'changeme',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // set true only if using HTTPS
}));

// ======= Set Locals and View Engine ======= //
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});
// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// ======= Use Auth Routes ======= //
const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blog');
app.use('/', authRoutes);
app.use('/blogs', blogRoutes);

const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ======= Home or Error Routes ======= //
app.get('/', (req, res) => res.redirect('/blogs/home'));
app.use((req, res) => res.status(404).render('404'));

// ======= Start Server ======= //
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

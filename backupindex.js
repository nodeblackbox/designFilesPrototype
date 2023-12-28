const express = require('express');
const axios = require('axios');
const passport = require('passport');
const session = require('express-session');
const ejs = require('ejs');
const path = require('path');

require('dotenv').config();



// adad
const app = express();

// Define our Polymorphic data 

// Database Configuration Import
const db = require('./config/dbConfig');
// const environmentConfig = require(`./config/${process.env.NODE_ENV || 'development'}.json`);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Setting view engine
app.set('view engine', 'ejs');
app.engine('html', ejs.renderFile);
app.use(express.static(path.join(__dirname, 'public')));


// Configuration Global variables
const globalConfig = require('./config/globalConfig');
// Environmental Configurations
const environmentDefault = require('./config/default.json');
const environmentDevelopment = require('./config/development.json');
const environmentProduction = require('./config/production.json');

// Route imports
const adminRoutes = require('./routes/adminRoutes');
const affiliateRoutes = require('./routes/affiliateRoutes');
const apiRoutes = require('./routes/apiRoutes');
const authRoutes = require('./routes/authRoutes');
const blogRoutes = require('./routes/blogRoutes');
const contactRoutes = require('./routes/contactRoutes');
const coursesRoutes = require('./routes/coursesRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const homeRoutes = require('./routes/homeRoutes');
const plansRoutes = require('./routes/plansRoutes');
const shopRoutes = require('./routes/shopRoutes');
const userRoutes = require('./routes/userRoutes');

// Middleware and session setup
app.use(session({ secret: 'mySecretKey', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());


app.use((req, res, next) => {
    req.globalConfig = globalConfig;
    next();
});

// Custom Middleware
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/auth/login');
}

function isAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'admin') {
        return next();
    }
    res.redirect('/auth/login');
}


// Route usage
app.use('/auth', authRoutes);
app.use('/admin', isAdmin, adminRoutes);
app.use('/affiliate', isLoggedIn, affiliateRoutes);
app.use('/api', apiRoutes);
app.use('/blog', blogRoutes);
app.use('/contact', contactRoutes);
app.use('/courses', coursesRoutes);
app.use('/gallery', galleryRoutes);
app.use('/home', homeRoutes);
app.use('/plans', plansRoutes);
app.use('/shop', shopRoutes);
app.use('/user', userRoutes);

// Register Users function
const registerUsers = async (user) => {
    try {
        const response = await axios.post('https://ecstasyessentials.shop/registered', user);
        console.log(`User ${user.username} registered successfully!`);
    } catch (error) {
        console.error(`Error registering user ${user.username}:`, error.response.data);
    }
};

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Express.js boilerplate app listening at http://localhost:${port}`);
});

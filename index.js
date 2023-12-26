// Required modules
const express = require('express');
const ejs = require('ejs');
require('dotenv').config();
const mysql = require('mysql');
const multer = require('multer');
const crypto = require('crypto');
const bodyParser = require('body-parser')
const passport = require('passport');
const Minio = require('minio');
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');
const stream = require('stream');
const base64ToImage = require('base64-to-image');
const axios = require('axios');
const session = require('express-session');
const { body, validationResult } = require('express-validator');
const MySQLStore = require('express-mysql-session')(session);
const util = require('util');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { error } = require('console');


const saltRounds = 10;


const app = express();

const port = process.env.PORT || 3000;


const PEPPER = 'yourRandomStringHere'; // Replace with your actual pepper


// MySQL database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

// MinIO Client Setup
const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: parseInt(process.env.MINIO_PORT),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY
});


// Create a MySQL store using the MySQLStore options
const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    port: 3306, // Default MySQL port
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    clearExpired: true,
    checkExpirationInterval: 900000, // How frequently expired sessions will be cleared; 15 minutes
    expiration: 86400000 // The maximum age of a valid session; 1 day
});

app.use(session({
    key: 'ai_dashboard_session_cookie',
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 86400000, // 1 day
        httpOnly: true, // Helps prevent cross-site scripting (XSS)
        secure: true, // Ensures the cookie is only used over HTTPS
        sameSite: 'lax' // Can be 'strict', 'lax', or 'none'. Helps mitigate CSRF attacks
    }
}));

// Middleware and session setup

app.use(passport.initialize());
app.use(passport.session());

db.connect((err) => {
    if (err) { throw err; }
    console.log('Connected to the MySQL Server');
});

// Define our Polymorphic data 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Setting view engine
// app.set('view engine', 'ejs');
app.engine('html', ejs.renderFile);
// // app.set('', path.join(__dirname, 'views'));
// app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));


// const products = [
//     { id: 1, price: 27.49, priceID: 'price_1ON5cBIAzvGScLipmmtCjAW3' },
//     { id: 2, price: 84.49, priceID: 'price_1ON6V9IAzvGScLipE7LHtWsH' },
// ];
const products = [
    {
        id: 1,
        name: "Basic Plan",
        description: "A perfect start for beginners",
        price: 27.49,
        priceID: 'price_1ON5cBIAzvGScLipmmtCjAW3',
        features: ["Access to basic AI models", "Email support"],
        hue: 165, // Example HSL value
        saturation: 82.26,
        lightness: 51.37
    },
    {
        id: 2,
        name: "Pro Plan",
        description: "Advanced features for professionals",
        price: 84.49,
        priceID: 'price_1ON6V9IAzvGScLipE7LHtWsH',
        features: ["Advanced AI model access", "Priority email support", "Webinars and tutorials"],
        hue: 291.34,
        saturation: 95.9,
        lightness: 61.76
    },
    {
        id: 3,
        name: "Pro Plan",
        description: "Advanced features for professionals",
        price: 338.69,
        priceID: 'price_1ON6V9IAzvGScLipE7LHtWsH',
        features: ["Advanced AI model access", "Priority email support", "Developer API Access"],
        hue: 338.69, // Different HSL value for the duplicate
        saturation: 100,
        lightness: 48.04
    }
];




app.get('/product/:productId', (req, res) => {
    console.log("test product/:productId")
    const product = products.find(p => p.id == req.params.productId);
    if (product) {
        res.render('productDetail', { product });
    } else {
        res.status(404).send('Product not found');
    }
});

app.post('/checkout/:productId', async (req, res) => {
    const product = products.find(p => p.id == req.body.productId);
    if (!product) {
        return res.status(404).send('Product not found');
    }

    try {
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            line_items: [{
                price: product.priceID,
                quantity: 1,
            }],
            success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}/payment-cancelled`,
        });
        return res.json({ url: session.url });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});




// app.get('/login', (req, res) => {
//     res.render('login.ejs');
// });

// app.post('/login', (req, res) => {
//     res.send('POST request to public/auth/login');
// });

// app.get('/register', (req, res) => {
//     res.render('register.ejs');
// });

// app.post('/register', (req, res) => {
//     res.send('POST request to public/auth/register');
// });

async function findRoleId(roleName) {
    return new Promise((resolve, reject) => {
        db.query('SELECT role_id FROM userRoles WHERE role_name = ?', [roleName], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results[0]?.role_id);
            }
        });
    });
}



app.get('/register', (req, res) => {
    res.render('register.ejs');
});



// app.post('/register', [
//     body('username')
//         .trim()
//         .isLength({ min: 2, max: 25 }).withMessage('Username must be between 2 to 25 characters.')
//         .matches(/^[A-Za-z0-9_]+$/).withMessage('Username must be alphanumeric with underscores.'),
//     body('email')
//         .trim()
//         .isEmail().withMessage('Invalid email address.'),
//     body('password')
//         .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
// ], (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         const errorMessages = errors.array().map(error => ({ parameter: error.param, message: error.msg, value: error.value }));
//         return res.render('register.ejs', { errors: errorMessages });
//     }

//     const { username, email, password } = req.body;
//     const plainPassword = PEPPER + password;

//     bcrypt.hash(plainPassword, saltRounds, function (err, hashedPassword) {
//         if (err) {
//             console.error("Error hashing password:", err);
//             return res.render('register.ejs', { errors: [{ message: 'Error hashing password.' }] });
//         }

//         let defaultRoleId = 2; // Adjust based on your roles setup
//         let sqlquery = "INSERT INTO users (username, email, password, role_id) VALUES (?,?,?,?)";

//         db.query(sqlquery, [username, email, hashedPassword, defaultRoleId], (err) => {
//             if (err) {
//                 if (err.code === 'ER_DUP_ENTRY') {
//                     const errorMessage = err.sqlMessage.includes('users.username') ? 'Username already exists.' : 'Email already exists.';
//                     return res.render('register.ejs', { errors: [{ message: errorMessage }] });
//                 }
//                 console.error("Error registering user:", err);
//                 return res.render('register.ejs', { errors: [{ message: 'Error registering user.' }] });
//             }
//             // Redirect to login page or send a success message
//             res.redirect('/login'); // Or `res.send('User registered successfully!');`
//         });
//     });
// });

app.post('/register', [
    body('username')
        .trim()
        .isLength({ min: 2, max: 25 }).withMessage('Username must be between 2 to 25 characters.')
        .matches(/^[A-Za-z0-9_]+$/).withMessage('Username must be alphanumeric with underscores.'),
    body('email')
        .trim()
        .isEmail().withMessage('Invalid email address.'),
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => ({ parameter: error.param, message: error.msg, value: error.value }));
        return res.render('register.ejs', { errors: errorMessages });
    }

    const { username, email, password } = req.body;
    const plainPassword = PEPPER + password;

    bcrypt.hash(plainPassword, saltRounds, function (err, hashedPassword) {
        if (err) {
            console.error("Error hashing password:", err);
            return res.render('register.ejs', { errors: [{ message: 'Error hashing password.' }] });
        }

        let defaultRoleId = 2; // Adjust based on your roles setup
        let sqlquery = "INSERT INTO users (username, email, password, role_id) VALUES (?,?,?,?)";

        db.query(sqlquery, [username, email, hashedPassword, defaultRoleId], (err) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    const errorMessage = err.sqlMessage.includes('users.username') ? 'Username already exists.' : 'Email already exists.';
                    return res.render('register.ejs', { errors: [{ message: errorMessage }] });
                }
                console.error("Error registering user:", err);
                return res.render('register.ejs', { errors: [{ message: 'An error occurred during registration. Please try again.' }] });
            }
            res.redirect('/login');
        });
    });
});


app.get('/login', (req, res) => {
    res.render('login.ejs');
});

app.post('/login', [
    body('username')
        .trim()
        .escape()
        .isLength({ min: 2, max: 20 }).withMessage('Username must be between 2 to 20 characters.')
        .matches(/^[A-Za-z0-9_]+$/).withMessage('Username must be alphanumeric with underscores.'),
    body('password')
        .trim()
        .escape()
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => ({ parameter: error.param, message: error.msg, value: error.value }));
        return res.render('login.ejs', { errors: errorMessages });
    }

    const { username, password } = req.body;
    const sqlquery = "SELECT user_id, password FROM users WHERE username = ?";

    db.query(sqlquery, [username], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.render('login.ejs', { errors: [{ message: 'Error logging in.' }] });
        }

        if (results.length === 0) {
            return res.render('login.ejs', { errors: [{ message: 'Invalid username or password.' }] });
        }

        const hashedPasswordFromDB = results[0].password;
        bcrypt.compare(PEPPER + password, hashedPasswordFromDB, (err, isMatch) => {
            if (err) {
                console.error("Error comparing passwords:", err);
                return res.render('login.ejs', { errors: [{ message: 'Error logging in.' }] });
            }

            if (isMatch) {
                req.session.userId = results[0].user_id;
                res.redirect('/userProfile'); // Redirect to the user's profile or dashboard
            } else {
                res.render('login.ejs', { errors: [{ message: 'Invalid username or password.' }] });
            }
        });
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error logging out');
        }
        res.redirect('/login');
    });
});
// // Input validation and sanitization for login
// app.post('/login', [
//     body('username')
//         .trim()
//         .escape() // Sanitizing input to prevent XSS
//         .isLength({ min: 2, max: 20 }).withMessage('Username must be between 2 to 20 characters.')
//         .matches(/^[A-Za-z0-9_]+$/).withMessage('Username must be alphanumeric with underscores.'),
//     body('password')
//         .trim()
//         .escape() // Sanitizing input to prevent XSS
//         .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
//         .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number.'),
// ], (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         const errorMessages = errors.array().map(error => ({ parameter: error.param, message: error.msg, value: error.value }));
//         return res.render('login.ejs', { errors: errorMessages });
//     }

//     const { username, password } = req.body;
//     const sqlquery = "SELECT password FROM users WHERE username = ?";

//     db.query(sqlquery, [username], (err, results) => {
//         if (err) {
//             console.error("Database error:", err);
//             return res.render('login.ejs', { errors: [{ message: 'Error logging in.' }] });
//         }

//         if (results.length === 0) {
//             return res.render('login.ejs', { errors: [{ message: 'Invalid username or password.' }] });
//         }

//         const hashedPasswordFromDB = results[0].password;
//         bcrypt.compare(PEPPER + password, hashedPasswordFromDB, (err, isMatch) => {
//             if (err) {
//                 console.error("Error comparing passwords:", err);
//                 return res.render('login.ejs', { errors: [{ message: 'Error logging in.' }] });
//             }

//             if (isMatch) {
//                 // Logic after successful login, e.g., setting up session
//                 // For demonstration:
//                 res.send('Login successful!');
//             } else {
//                 res.render('login.ejs', { errors: [{ message: 'Invalid username or password.' }] });
//             }
//         });
//     });
// });

// Logout Route
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error(err);
            // Generic error message
            return res.status(500).send('Error occurred while logging out. Please try again.');
        }
        res.redirect('/login');
    });
});

app.get('/userProfile', async (req, res) => {
    if (!req.session.userId) {
        // Redirect to login page if not logged in
        return res.redirect('/login');
    }

    try {
        const userQuery = 'SELECT username, email, profile_picture, bio FROM users WHERE user_id = ?';
        db.query(userQuery, [req.session.userId], (err, results) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).send('Error fetching user profile');
            }
            if (results.length === 0) {
                return res.status(404).send('User not found');
            }

            const user = results[0];
            res.render('userProfile', { user });
        });
    } catch (err) {
        console.error("Error:", err);
        res.status(500).send('Error fetching user profile');
    }
});
app.post('/userProfile', (req, res) => {
    res.send('POST request to userProfile');
});





app.get('/addbook', function (req, res) {
    const sqlquery = "SELECT * FROM publishers";
    db.query(sqlquery, (err, publishers) => {
        if (err) {
            return res.status(500).send('There was a problem retrieving publishers. Please try again later.');
        } else {
            res.render('addbook.ejs', {
                ...shopData,      // This unpacks ...shopData and sends its properties to the view
                publishers: publishers
            });
        }
    });
});


app.get('/plans', (req, res) => {
    res.render('plans.ejs', { products });
});

app.post('/plans', (req, res) => {
    res.send('POST request to public/plans');
});

app.get('/payment-success', (req, res) => {
    res.render('success');
});

app.get('/payment-cancelled', (req, res) => {
    res.render('cancelled');
});


app.get('/', (req, res) => {
    res.render('index', { products });
});

app.post('/', (req, res) => {
    res.send('POST request to index');
});

// Example database query inside a route
app.get('/example', (req, res) => {
    db.query('SELECT * FROM userRoles', (err, results) => {
        if (err) throw err;
        res.send(results);
    });
});


app.get('/dashboard', (req, res) => {
    // res.render('dashboard.ejs');
    res.render('dashboard', { user: req.session.user });
});
// This is going to be the dashboard
app.post('/dashboard', async (req, res) => {
    const { prompt, negative_prompt, steps, seed, width, height, cfg_scale } = req.body;
    try {
        const response = await axios.post('https://Some random numbers for ngrock.ngrok-free.app/generateImage', {
            prompt,
            negative_prompt,
            steps,
            seed,
            width,
            height,
            cfg_scale
        });

        // Send the image data back to the client
        const imageHex = response.data.imageHex;
        res.json({ imageHex });
    } catch (error) {
        console.error(`Error: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});



// Test functionality for database
app.get('/addbook', (req, res) => {
    res.render('addbook.ejs');
});

app.post('/addbook', (req, res) => {
    res.send('POST request to addbook');
});


// Test queries for listing 
app.get('/list', (req, res) => {
    res.render('ejs');
});

app.post('/list', (req, res) => {
    res.send('POST request to list');
});



app.get('/adminPanel', (req, res) => {
    res.render('adminPanel.ejs');
});

app.post('/adminPanel', (req, res) => {
    res.send('POST request to admin/adminPanel');
});

app.get('/affiliate', (req, res) => {
    res.render('affiliate.ejs');
});

app.post('/affiliate', (req, res) => {
    res.send('POST request to affiliate/affiliate');
});

app.get('/DevelopersAPI', (req, res) => {
    res.render('DevelopersAPI');
});

app.post('/DevelopersAPI', (req, res) => {
    res.send('POST request to /DevelopersAPI');
});

app.get('/addBlogPost', (req, res) => {
    res.render('addBlogPost.ejs');
});

app.post('/addBlogPost', (req, res) => {
    res.send('POST request to blog/addBlogPost');
});

app.get('/blogDetail', (req, res) => {
    res.render('blogDetail.ejs');
});

app.post('/blogDetail', (req, res) => {
    res.send('POST request to blog/blogDetail');
});

app.get('/courses', (req, res) => {
    res.render('courses.ejs');
});

app.post('/courses', (req, res) => {
    res.send('POST request to courses/courses');
});

app.get('/mygallery', (req, res) => {
    res.render('mygallery.ejs');
});

app.post('/mygallery', (req, res) => {
    res.send('POST request to mygallery/mygallery');
});

app.get('/bargains', (req, res) => {
    res.render('bargains.ejs');
});

app.post('/bargains', (req, res) => {
    res.send('POST request to shop/bargains');
});

app.get('/extensionsProductPage', (req, res) => {
    res.render('extensionsProductPage.ejs');
});

app.post('/extensionsProductPage', (req, res) => {
    res.send('POST request to shop/extensionsProductPage');
});

app.get('/extensionsShop', (req, res) => {
    res.render('extensionsShop.ejs');
});

app.post('/extensionsShop', (req, res) => {
    res.send('POST request to shop/extensionsShop');
});

app.get('/search', (req, res) => {
    res.render('search.ejs');
});

app.post('/search', (req, res) => {
    res.send('POST request to shop/search');
});


app.get('/likedBlogs', (req, res) => {
    res.render('likedBlogs.ejs');
});

app.post('/likedBlogs', (req, res) => {
    res.send('POST request to user/likedBlogs');
});

app.get('/notifications', (req, res) => {
    res.render('notifications.ejs');
});

app.post('/notifications', (req, res) => {
    res.send('POST request to user/notifications');
});






app.get('/blog', (req, res) => {
    res.render('blog.ejs');
});

app.post('/blog', (req, res) => {
    res.send('POST request to public/blog/blog');
});

app.get('/contactUs', (req, res) => {
    res.render('contactUs.ejs');
});

app.post('/contactUs', (req, res) => {
    res.send('POST request to public/contact/contactUs');
});

app.get('/errorPage', (req, res) => {
    console.log("test from errorPage")
    res.render('errorPage.ejs');
});

app.post('/errorPage', (req, res) => {
    res.send('POST request to public/errorPage');
});

app.get('/gallery', (req, res) => {
    res.render('gallery.ejs');
});

app.post('/gallery', (req, res) => {
    res.send('POST request to public/gallery');
});

app.get('/about', (req, res) => {
    res.render('about.ejs');
});

app.post('/about', (req, res) => {
    res.send('POST request to public/home/about');
});




app.get('/privacyPolicy', (req, res) => {
    res.render('privacyPolicy.ejs');
});

app.post('/privacyPolicy', (req, res) => {
    res.send('POST request to public/privacyPolicy');
});

app.get('/SalesFunnelVideo', (req, res) => {
    res.render('SalesFunnelVideo.ejs');
});

app.post('/SalesFunnelVideo', (req, res) => {
    res.send('POST request to public/SalesFunnelVideo');
});

app.get('/termsOfUse', (req, res) => {
    res.render('termsOfUse.ejs');
});

app.post('/termsOfUse', (req, res) => {
    res.send('POST request to public/termsOfUse');
});



app.get('/loginProto', (req, res) => {
    res.render('loginProto.ejs');
});

app.post('/loginProto', (req, res) => {
    res.send('POST request to public/loginProto');
});



// Start the server
app.listen(port, () => {
    console.log(`Express.js boilerplate app listening at http://localhost:${port}`);
});


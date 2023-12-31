// Required modules
const express = require('express');
const ejs = require('ejs');
require('dotenv').config();
const mysql = require('mysql');
const multer = require('multer');
const crypto = require('crypto');
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
const rateLimit = require('express-rate-limit');
// Removed unused `error` require from 'console'

// Rate Limiting for login attempts
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per windowMs
    message: 'Too many login attempts from this IP, please try again after 15 minutes'
});

const saltRounds = 10;
const app = express();
const port = process.env.PORT || 3000;
const PEPPER = 'yourRandomStringHere'; // Replace with your actual pepper
const bucketName = process.env.MINIO_BUCKET_NAME;

// MySQL Database connection
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

// Session Store Setup
const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    port: 3306, // Default MySQL port
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    clearExpired: true,
    checkExpirationInterval: 900000, // 15 minutes
    expiration: 86400000 // 1 day
});

// Session configuration
app.use(session({
    key: 'ai_dashboard_session_cookie',
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 86400000, // 1 day
        httpOnly: false, // Helps prevent cross-site scripting (XSS)
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production only
        sameSite: 'lax'
    }
}));

// Passport initialization for authentication
app.use(passport.initialize());
app.use(passport.session());

// Establish database connection
db.connect((err) => {
    if (err) { throw err; }
    console.log('Connected to the MySQL Server');
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// TODO: Implement subscription authentication for the dashboard.

// Stripe Webhook endpoint for handling payment events
app.post('/webhook', express.raw({ type: 'application/json' }), (request, response) => {
    // Retrieve the Stripe signature from the request headers
    const sig = request.headers['stripe-signature'];

    // Parse the JSON from the request body
    const requestBody = JSON.parse(request.body.toString());

    // Extract the userId from the metadata before checking the event
    // and split it to separate the user ID and product ID
    const userId = requestBody.data.object.metadata.userId;
    console.log("User ID:", userId);

    let idarr = userId.split(",");
    let ProcessedUserID = idarr[0];
    let ProcessedProductID = idarr[1];
    console.log("UserID", ProcessedUserID);
    console.log("ProductID", ProcessedProductID);

    // Update query to mark the subscription as active in the database
    const updateQuery = `
        UPDATE subscriptionHistory 
        SET status = 'active', stripe_subscription_id = ?
        WHERE user_id = ? AND status = 'pending'
    `;

    // Execute the update query with the extracted user and product IDs
    db.query(updateQuery, [ProcessedProductID, ProcessedUserID], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return response.status(500).send('Error 9000');
        }
    });

    console.log("Request from payment", request.body.toString());

    let event;
    try {
        // Construct the event using Stripe's library
        const eventJson = JSON.stringify(request.body);
        event = stripe.webhooks.constructEvent(eventJson, sig, endpointSecret);
        console.log("Event", event)
        console.log("Event Type", event.type)

    } catch (err) {
        // Handle errors in event construction and send a response
        response.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    // Handle different types of events received from Stripe
    switch (event.type) {
        case 'checkout.session.completed':
            const checkoutSessionCompleted = event.data.object;
            console.log(checkoutSessionCompleted)
            // Handle the checkout session completed event
            break;
        // Add more cases to handle other Stripe event types
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    console.log('Finished processing webhook event');

    // Return a 200 response to acknowledge receipt of the event
    response.status(200).send();
});

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setting up EJS as the view engine
app.engine('html', ejs.renderFile);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Define product offerings with details and pricing
const products = [
    // Basic Plan
    {
        id: 1,
        name: "Basic Plan",
        description: "A perfect start for beginners",
        price: 27.49,
        priceID: 'price_1ON5cBIAzvGScLipmmtCjAW3',
        features: ["Access to basic AI models", "Email support"],
        hue: 165,
        saturation: 82.26,
        lightness: 51.37
    },
    // Pro Plan
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
    // Duplicate Pro Plan with different pricing
    {
        id: 3,
        name: "Pro Plan",
        description: "Advanced features for professionals",
        price: 338.69,
        priceID: 'price_1ORZwoIAzvGScLipp5RngcsB',
        features: ["Advanced AI model access", "Priority email support", "Developer API Access"],
        hue: 338.69,
        saturation: 100,
        lightness: 48.04
    }
];


// Route handler for displaying product details
app.get('/product/:productId', (req, res) => {
    // Check if user is logged in by verifying the session userId
    if (!req.session.userId) {
        // Redirect to the login page if the user is not logged in
        return res.redirect('/login');
    }
    console.log("test product/:productId");

    // Find the product with the given productId in the products array
    const product = products.find(p => p.id == req.params.productId);

    // If the product is found, render the productDetail page with product data
    if (product) {
        res.render('productDetail', { product });
    } else {
        // If the product is not found, send a 404 (Not Found) response
        res.status(404).send('Product not found');
    }
});

// Helper function to execute a MySQL database query
function executeDatabaseQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        // Execute the query with the provided parameters
        db.query(query, params, (err, results) => {
            if (err) {
                // Reject the promise if there's an error
                reject(err);
            } else {
                // Resolve the promise with the query results
                resolve(results);
            }
        });
    });
}


// Debugging log for session information
console.log("session", JSON.stringify(session))

// Route handler for displaying subscription plans
app.get('/plans', (req, res) => {
    // Render the plans page using EJS and pass the products data
    res.render('plans.ejs', { products });
});

// Placeholder handler for POST requests to /plans
app.post('/plans', (req, res) => {
    // Responds to POST requests to /plans
    res.send('POST request to public/plans');
});

// Route handler for successful payment page
app.get('/payment-success', (req, res) => {
    // Render the success page for successful payments
    res.render('success');
});

// Route handler for cancelled payment page
app.get('/payment-cancelled', (req, res) => {
    // Render the cancelled page when payment is cancelled
    res.render('cancelled');
});


// Route handler for processing a product checkout
app.post('/checkout/:productId', async (req, res) => {
    // Verify if the user is authenticated
    if (!req.session.userId) {
        // Respond with a 403 (Forbidden) if the user is not authenticated
        return res.status(403).send('User not authenticated');
    }

    // Extract userId and productId from the request
    const userId = req.session.userId;
    const productId = parseInt(req.params.productId);
    // Find the product in the products array
    const product = products.find(p => p.id === productId);

    // Return a 404 response if the product is not found
    if (!product) {
        return res.status(404).send('Product not found');
    }

    // Use the product ID as the subscription ID (or use a method to get the correct ID)
    const subscriptionId = product.id;

    try {
        // Check if the user exists in the database
        const userCheckQuery = 'SELECT * FROM users WHERE user_id = ?';
        const userCheckResult = await executeDatabaseQuery(userCheckQuery, [userId]);

        // If the user is not found, return a 404 response
        if (userCheckResult.length === 0) {
            return res.status(404).send('User not found');
        }

        // Query for existing active subscriptions for the user
        const existingSubscriptionsQuery = `
            SELECT * FROM subscriptionHistory
            WHERE user_id = ? AND status = 'active'
        `;
        const existingSubscriptions = await executeDatabaseQuery(existingSubscriptionsQuery, [userId]);

        // Check if the user is already subscribed to the selected plan
        const isAlreadySubscribed = existingSubscriptions.some(sub => sub.subscription_id === subscriptionId);

        // If already subscribed, return a 409 (Conflict) response
        if (isAlreadySubscribed) {
            return res.status(409).send('You are already subscribed to this plan');
        }

        // Insert a pending subscription record into the database
        const insertQuery = `
            INSERT INTO subscriptionHistory (user_id, subscription_id, status)
            VALUES (?, ?, 'pending')
        `;
        await executeDatabaseQuery(insertQuery, [userId, subscriptionId]);

        // Concatenate userId and product details for Stripe metadata
        const concat = userId.toString() + "," + product.id.toString() + "," + product.priceID.toString();

        // Create a Stripe checkout session for the subscription
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            line_items: [{
                price: product.priceID,
                quantity: 1
            }],
            metadata: {
                userId: concat.toString(),
            },
            success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}/payment-cancelled`,
        });

        // Respond with the URL of the Stripe checkout session
        res.json({ url: session.url });
    } catch (error) {
        // Log and respond with any errors encountered during the process
        console.error(`Error processing subscription for user ID ${userId}:`, error);
        res.status(500).send({ error: error.message });
    }
});

// Route handler for general search in the API
app.get('/api/search', (req, res) => {
    // Extract the search term from query parameters
    const searchTerm = req.query.term;
    // SQL query to search in the generatedImages table by matching headers, descriptions, or tags
    const searchQuery = `
    SELECT * FROM generatedImages 
    WHERE header LIKE ? OR description LIKE ? OR tags LIKE ?
  `;
    // Execute the search query and handle the response
    db.query(searchQuery, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`], (err, results) => {
        if (err) {
            // Log the error and return a 500 Internal Server Error if there's an issue with the query
            console.error(err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        // Return the search results in JSON format
        res.json({ items: results });
    });
});



//api Index page
app.get('/api/search/basic', (req, res) => {
    console.log("/api/search/basic")
    const searchTerm = req.query.term;
    const searchQuery = `
    SELECT * FROM generatedImages 
    WHERE header LIKE ? OR description LIKE ? OR tags LIKE ?
    `;
    db.query(searchQuery, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json({ items: results });
    });
});

// Function to execute general search queries with optional filters
function executeSearchQuery(res, baseQuery, queryParams) {
    // Execute the provided SQL query with the given parameters
    db.query(baseQuery, queryParams, (err, results) => {
        if (err) {
            // Log and return a server error if the query fails
            console.error(err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        // Send back the query results in JSON format
        res.json({ items: results });
    });
}

// Unified API endpoint to handle various search types
app.get('/api/search/:type', (req, res) => {
    // Extract search type and other potential query parameters
    const searchType = req.params.type;
    const searchTerm = req.query.term || '';
    const userId = req.query.userId || '';
    const style = req.query.style || '';
    const negativePrompt = req.query.negativePrompt || '';

    // Initialize the base SQL query for fetching images
    let searchQuery = 'SELECT * FROM generatedImages';
    // Arrays to store query parameters and conditional filters
    let queryParams = [];
    let filters = [];

    // Use a switch statement to handle different search types
    switch (searchType) {
        case 'basic':
            // For basic search, look for the term in header, description, or tags
            if (searchTerm) {
                filters.push(' (header LIKE ? OR description LIKE ? OR tags LIKE ?) ');
                queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
            }
            break;
        case 'user':
            // For user search, filter by user_id
            filters.push(' user_id = ? ');
            queryParams.push(userId);
            break;
        case 'style':
            // For style search, filter by style
            filters.push(' style = ? ');
            queryParams.push(style);
            break;
        case 'negativePrompt':
            // For negative prompt search, filter by negative_prompt
            filters.push(' negative_prompt LIKE ? ');
            queryParams.push(`%${negativePrompt}%`);
            break;
        case 'alphabetical':
            // For alphabetical sorting, order results by header
            searchQuery += ' ORDER BY header ASC';
            break;
        default:
            // If an invalid search type is provided, return an error
            return res.status(400).json({ message: 'Invalid search type' });
    }

    // If filters are present, append them to the base query
    if (filters.length > 0) {
        searchQuery += ' WHERE ' + filters.join(' AND ');
    }

    // Execute the search query with the constructed filters
    executeSearchQuery(res, searchQuery, queryParams);
});
// API endpoint to handle account deletion requests
app.post('/api/delete-account', (req, res) => {
    console.log("/api/delete-account");
    // Extract user ID from request body
    const userId = req.body.userId;

    // Check if user ID is provided, return an error if not
    if (!userId) {
        return res.status(400).send({ message: 'User ID is required' });
    }

    // Retrieve the current username for the given user ID
    db.query('SELECT username FROM users WHERE user_id = ?', [userId], (err, results) => {
        if (err) {
            // Log and return a server error if the query fails
            console.error(err);
            return res.status(500).send({ message: 'Internal server error' });
        }
        // If no user is found, return a 404 error
        if (results.length === 0) {
            return res.status(404).send({ message: 'User not found' });
        }

        // Append a suffix to the username to indicate account deletion
        const newUsername = results[0].username + '_deleted_user';

        // Update the username in the database to reflect the account deletion
        const updateQuery = 'UPDATE users SET username = ? WHERE user_id = ?';
        db.query(updateQuery, [newUsername, userId], (updateErr, updateResult) => {
            if (updateErr) {
                // Log and return a server error if the update query fails
                console.error(updateErr);
                return res.status(500).send({ message: 'Error updating username' });
            }
            // If no rows are affected, it means the user was not found
            if (updateResult.affectedRows === 0) {
                return res.status(404).send({ message: 'User not found' });
            }
            // Return a success message after updating the account
            res.send({ message: 'Account successfully updated' });
        });
    });
});

// Function to find a role ID based on the role name
async function findRoleId(roleName) {
    // Return a new Promise for asynchronous query execution
    return new Promise((resolve, reject) => {
        // Execute SQL query to find the role ID for the given role name
        db.query('SELECT role_id FROM userRoles WHERE role_name = ?', [roleName], (err, results) => {
            if (err) {
                // Reject the promise if there's an error
                reject(err);
            } else {
                // Resolve the promise with the role ID, if found
                resolve(results[0]?.role_id);
            }
        });
    });
}

// Route handler for registration page
app.get('/register', (req, res) => {
    // Render the registration page
    // No server-side validation or logic needed for this GET request
    // It simply displays the registration form to the user
    res.render('register.ejs');
});

// Route handler for processing registration data
app.post('/register', [
    // Validate and sanitize the 'username'
    body('username')
        .trim() // Remove any extra whitespace
        .isLength({ min: 2, max: 25 }).withMessage('Username must be between 2 to 25 characters.') // Enforce length constraints
        .matches(/^[A-Za-z0-9_]+$/).withMessage('Username must be alphanumeric with underscores.'), // Ensure only allowed characters are used

    // Validate and sanitize the 'email'
    body('email')
        .trim() // Remove extra whitespace
        .isEmail().withMessage('Invalid email address.'), // Check if the input is a valid email

    // Validate the 'password'
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.') // Enforce minimum length for security
], (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // If there are errors, send them back to the registration page
        const errorMessages = errors.array().map(error => ({ parameter: error.param, message: error.msg, value: error.value }));
        return res.render('register.ejs', { errors: errorMessages });
    }

    // Extract validated and sanitized data from the request
    const { username, email, password } = req.body;

    // Prepend a 'pepper' value to the password for additional security
    const plainPassword = PEPPER + password;

    // Hash the password with bcrypt
    bcrypt.hash(plainPassword, saltRounds, function (err, hashedPassword) {
        if (err) {
            // In case of a hashing error, log it and return an error message
            console.error("Error hashing password:", err);
            return res.render('register.ejs', { errors: [{ message: 'Error hashing password.' }] });
        }

        // Default role ID for new users - adjust as needed
        let defaultRoleId = 2;

        // SQL query to insert a new user record into the database
        let sqlquery = "INSERT INTO users (username, email, password, role_id, profile_picture) VALUES (?,?,?,?,?)";

        // Default profile picture for new users
        let DefaultProfilePicture = "ecstasyessentials.shop/images/Pfp.jpeg";

        // Execute the query to insert the new user
        db.query(sqlquery, [username, email, hashedPassword, defaultRoleId, DefaultProfilePicture], (err) => {
            if (err) {
                // Handle specific error for duplicate entries (username or email)
                if (err.code === 'ER_DUP_ENTRY') {
                    const errorMessage = err.sqlMessage.includes('users.username') ? 'Username already exists.' : 'Email already exists.';
                    return res.render('register.ejs', { errors: [{ message: errorMessage }] });
                }
                // Log other errors and show a generic error message
                console.error("Error registering user:", err);
                return res.render('register.ejs', { errors: [{ message: 'An error occurred during registration. Please try again.' }] });
            }
            // Redirect to the login page after successful registration
            res.redirect('/login');
        });
    });
});

// Route handler for login page
app.get('/login', (req, res) => {
    // Render the login page
    // This GET request simply displays the login form to the user
    res.render('login.ejs');
});

// Route handler for processing login data
app.post('/login', [
    // Validate and sanitize the 'username'
    body('username')
        .trim() // Remove any extra whitespace
        .escape() // Escape any special characters to prevent injection attacks
        .isLength({ min: 2, max: 20 }).withMessage('Username must be between 2 to 20 characters.') // Enforce length constraints
        .matches(/^[A-Za-z0-9_]+$/).withMessage('Username must be alphanumeric with underscores.'), // Ensure valid characters

    // Validate and sanitize the 'password'
    body('password')
        .trim() // Remove extra whitespace
        .escape() // Escape special characters
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.') // Check password length
], (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Send validation errors back to the login page
        const errorMessages = errors.array().map(error => ({ parameter: error.param, message: error.msg, value: error.value }));
        return res.render('login.ejs', { errors: errorMessages });
    }

    // Extract the validated data from the request
    const { username, password } = req.body;
    // SQL query to fetch user data based on username
    const sqlquery = "SELECT user_id, password FROM users WHERE username = ?";

    // Execute the query
    db.query(sqlquery, [username], (err, results) => {
        if (err) {
            // Log and handle database errors
            console.error("Database error:", err);
            return res.render('login.ejs', { errors: [{ message: 'Error logging in.' }] });
        }

        // Check if user exists
        if (results.length === 0) {
            // If no user is found, return an error
            return res.render('login.ejs', { errors: [{ message: 'Invalid username or password.' }] });
        }

        // Compare the provided password with the stored hashed password
        const hashedPasswordFromDB = results[0].password;
        bcrypt.compare(PEPPER + password, hashedPasswordFromDB, (err, isMatch) => {
            if (err) {
                // Handle bcrypt comparison errors
                console.error("Error comparing passwords:", err);
                return res.render('login.ejs', { errors: [{ message: 'Error logging in.' }] });
            }

            if (isMatch) {
                // If passwords match, set the user ID in the session
                req.session.userId = results[0].user_id;
                req.session.save(err => {
                    if (err) {
                        // Handle session saving errors
                        console.error("Error saving session:", err);
                        return res.render('login.ejs', { errors: [{ message: 'Error logging in.' }] });
                    }
                    // Redirect to the user profile page after successful login
                    res.redirect('/userProfile');
                });
            } else {
                // If passwords do not match, return an error
                res.render('login.ejs', { errors: [{ message: 'Invalid username or password.' }] });
            }
        });
    });
});

// Route handler for logging out
app.get('/logout', (req, res) => {
    // Destroy the session to log out the user
    req.session.destroy(err => {
        if (err) {
            // Log and handle session destruction errors
            console.error(err);
            return res.status(500).send('Error logging out');
        }
        // Redirect to the login page after successful logout
        res.redirect('/login');
    });
});


app.get('/userProfile', async (req, res) => {
    console.log('req.sessionID => Session ID:', req.sessionID);
    console.log('req.session => Session Data userId:', req.session);
    console.log('req.session.userId => Session Data userId:', req.session.userId);
    if (!req.session.userId) {
        // Redirect to login page if not logged in
        return res.redirect('/login');
    }
    // console.log(user)
    console.log("user", req.session.userId)
    try {
        const userQuery = `
            SELECT username, email, profile_picture, bio FROM users WHERE user_id = ?`;
        db.query(userQuery, [req.session.userId], (err, results) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).send('Error fetching user profile');
            }

            if (results.length === 0) {
                return res.status(404).send('User not found');
            }

            const user = results[0];
            console.log("user", user)
            // create a new array of image objects
            const userImgQuery = `SELECT * FROM userGallery WHERE user_id = ?`;

            db.query(userImgQuery, [req.session.userId], (err, results) => {
                if (err) {
                    console.error("Database error:", err);
                    return res.status(500).send('Error fetching user images');
                }
                // if (results.length === 0) {
                //     return res.status(404).send('User not found');
                // }
                const images = results;
                console.log("images", images)
                res.render('userProfile', { user, images });
            });
        });
    } catch (err) {
        console.error("Error:", err);
        res.status(500).send('Error fetching user profile');
    }
});


app.post('/userProfile', (req, res) => {
    res.send('POST request to userProfile');
});


app.get('/userImages/:userId', (req, res) => {
    const userId = req.params.userId;
    const query = "SELECT * FROM userGallery WHERE user_id = ?";

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send('Error fetching images');
        }
        res.json(results);
    });
});


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



// app.get('/addbook', function (req, res) {
//     const sqlquery = "SELECT * FROM publishers";
//     db.query(sqlquery, (err, publishers) => {
//         if (err) {
//             return res.status(500).send('There was a problem retrieving publishers. Please try again later.');
//         } else {
//             res.render('addbook.ejs', {
//                 ...shopData,      // This unpacks ...shopData and sends its properties to the view
//                 publishers: publishers
//             });
//         }
//     });
// });
// Flag to track login status
var isLoggedIn = false;

// Route handler for the home page
app.get('/', (req, res) => {
    // Check if the user is logged in by looking for a session userId
    if (req.session.userId) {
        console.log("req.session.userId", req.session.userId);
        isLoggedIn = true; // Set isLoggedIn to true if the user is logged in
    } else {
        isLoggedIn = false; // Set isLoggedIn to false if the user is not logged in
    }
    // Render the index page, passing the login status and products data
    res.render('index', { isLoggedIn, products });
});

// Route handler for POST requests to the home page
app.post('/', (req, res) => {
    // Currently, this handler just acknowledges POST requests to the index
    // Can be expanded for handling specific forms/data submissions
    res.send('POST request to index');
});

// Route for demonstrating a basic database query
app.get('/example', (req, res) => {
    // Perform a SQL query to select all entries from 'userRoles'
    db.query('SELECT * FROM userRoles', (err, results) => {
        if (err) {
            // Throw an error if the query fails
            throw err;
        }
        // Send the results of the query to the client
        res.send(results);
    });
});

// Utility function to convert a data URL to a File object
function dataURLtoFile(dataurl, filename) {
    var arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1], // Extract MIME type
        bstr = atob(arr[1]), // Decode base64 string
        n = bstr.length,
        u8arr = new Uint8Array(n); // Create a Uint8Array for binary data

    while (n--) {
        u8arr[n] = bstr.charCodeAt(n); // Fill the Uint8Array with byte data
    }

    // Return a new File object with the specified filename and MIME type
    return new File([u8arr], filename, { type: mime });
}

// Example usage of dataURLtoFile function
var file = dataURLtoFile('data:text/plain;base64,aGVsbG8gd29ybGQ=', 'hello.txt');
console.log(file); // Logging the created File object

// Configuration for multer disk storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Set destination for uploaded files
        cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
        // Use the original filename for the stored file
        cb(null, file.originalname)
    }
});

// Route handler for the gallery page
app.get('/gallery', (req, res) => {
    const bucketName = 'aidashboardbucket'; // Name of the MinIO bucket
    const objects = []; // Array to store object data from the bucket

    // List objects in the bucket using MinIO client
    minioClient.listObjectsV2(bucketName, '', true, "1000")
        .on("error", error => {
            // Handle errors during object listing
            console.error(error);
            res.status(500).send("Error fetching images");
        })
        .on('data', data => {
            // Process each object's data
            objects.push({
                name: data.name,
                url: `/images/${data.name}` // Construct URL for each object
            });
        })
        .on('end', () => {
            // Render the gallery page with the list of images
            res.render('gallery', { images: objects });
        });
});



// // Endpoint to list all images in a bucket
// app.get('/gallery', (req, res) => {
//     const bucketName = 'aidashboardbucket';
//     console.log("imagesss-------------");

//     const objects = [];

//     minioClient.listObjectsV2(bucketName, '', true, "1000")
//         .on("error", error => {
//             console.log(error)
//             return res.status(500).send(error)
//         })
//         .on('data', data => {
//             // console.log("data")
//             objects.push(data)
//         })
//         .on('end', () => {
//             console.log("end")
//             let html = '<h1>Images</h1>';
//             console.log(objects)
//             objects.forEach(file => {
//                 html += `<div><img src="/images/${file.name}" style="width:200px;"><p>${file.name}</p></div>`;
//             });
//             res.send(html);
//         })
// });



app.get('/images/:imageName', (req, res) => {

    const objectName = req.params.imageName;

    minioClient.getObject(bucketName, objectName, (err, stream) => {
        if (err) {
            res.status(500).send(err);
            return;
        }
        res.setHeader('Content-Type', 'image/png'); // Set the appropriate content-type
        stream.pipe(res);
    });
});

// Multer setup for handling file uploads
const upload = multer({ dest: 'uploads/' });

// Route to retrieve images from MinIO storage
app.get('/images/:imageName', (req, res) => {
    const objectName = req.params.imageName; // Extract image name from URL parameter

    // Retrieve the specified object (image) from MinIO
    minioClient.getObject(bucketName, objectName, (err, stream) => {
        if (err) {
            // Handle errors during retrieval, such as missing file
            res.status(500).send(err);
            return;
        }
        // Set content-type header to display the image correctly
        res.setHeader('Content-Type', 'image/png');
        // Pipe the image stream directly to the response
        stream.pipe(res);
    });
});


// Import Readable stream class from 'stream' module
const { Readable } = require('stream');

// Route handler for the dashboard page
app.get('/dashboard', (req, res) => {
    // Check if the user is logged in
    if (!req.session.userId) {
        // Redirect to login page if not authenticated
        return res.redirect('/login');
    }
    // Render the dashboard with the user's session ID
    res.render('dashboard', { userId: req.session.userId });
});



// Route handler for POST requests on the dashboard
app.post('/dashboard', async (req, res) => {
    // Extract image generation parameters from request body
    const { prompt, negative_prompt, steps, seed, width, height, cfg_scale, userId } = req.body;

    // Log received parameters for audit and debugging purposes
    console.log("Received prompt:", prompt);
    // ... similar logs for other parameters

    try {
        // Send a POST request to an external AI image generation service
        const response = await axios.post('https://a291-147-12-195-79.ngrok-free.app/generateImage', {
            prompt, negative_prompt, steps, seed, width, height, cfg_scale
        });

        // Convert the base64 encoded image from response to a Buffer
        const imageHex = response.data.imageHex;
        const imageBuffer = Buffer.from(imageHex, 'base64');

        // Create a Readable stream from the Buffer for uploading
        const readableStream = new Readable();
        readableStream.push(imageBuffer);
        readableStream.push(null);

        // Define a unique file name for the image
        const fileName = `image_${Date.now()}.jpeg`;

        // Upload the image to MinIO
        const bucketName = 'aidashboardbucket';
        minioClient.putObject(bucketName, fileName, readableStream, imageBuffer.length, async (err, etag) => {
            if (err) {
                // Handle errors during image upload to MinIO
                console.error(`Error uploading to MinIO: ${err}`);
                return res.status(500).send({ message: 'Error uploading image', error: err.message });
            }

            // Construct the URL for the uploaded image
            const imageUrl = `https://ecstasyessentials.shop/images/${fileName}`;

            // Store the image URL and related data in the userGallery table
            const insertQuery = "INSERT INTO userGallery (user_id, prompt, negative_prompt, steps, seed, width, height, cfg_scale, image_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";
            db.query(insertQuery, [userId, prompt, negative_prompt, steps, seed, width, height, cfg_scale, imageUrl], (err, results) => {
                if (err) {
                    // Handle errors during database insert operation
                    console.error(`Error saving image data to database: ${err}`);
                    return res.status(500).send({ message: 'Error saving image data', error: err.message });
                }
                console.log("Image data saved to database");

                // Respond with the base64 image data
                res.json({ imageHex });
            });
        });
    } catch (error) {
        // Handle errors from the AI image generation service
        console.error(`Error: ${error.message}`);
        res.status(500).json({ error: error.message, message: 'Error generating image' });
    }
});


// Developer API Page Route
app.get('/DevelopersAPI', (req, res) => {
    // Render the Developer API documentation or interface page.
    // This page can include documentation, examples, or even interactive elements for developers.
    res.render('DevelopersAPI');
});

// Global declaration of secretKey for encryption purposes
const secretKey = process.env.SecretCryptoKey; // Loaded from environment variables for security

// Variable to store the dynamically changing ngrok URL
var currentNgrokUrl = null; // Ngrok URLs are used for creating secure tunnels to localhost

// Flag to track the AI server's connection status
let isAiServerConnected = false; // Used to manage and monitor the connection with the external AI server

// Function to decrypt text using AES-256-GCM algorithm
function decrypt(text, secretKey) {
    // Split the encrypted text into its components (initialization vector, encrypted text, and tag)
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.shift(), 'hex');
    const tag = Buffer.from(textParts.shift(), 'hex');

    // Initialize a decipher with the secret key and IV
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(secretKey, 'hex'), iv);
    decipher.setAuthTag(tag); // Set the authentication tag for GCM mode

    // Decrypt the text and concatenate any additional authenticated data
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    // Return the decrypted string
    return decrypted.toString();
}

// Route handler for serving the prototype page
app.get('/prototype', (req, res) => {
    // Render a prototype page, potentially used for testing new features or interfaces
    res.render('prototype.ejs');
});

// Route for receiving and decrypting the ngrok URL
app.post('/receive-ngrok-url', (req, res) => {
    try {
        // Extract the encrypted ngrok URL sent from an external source
        const encryptedNgrokUrl = req.body.ngrokUrl;
        console.log('Receiving ngrok url', encryptedNgrokUrl);

        // Decrypt the ngrok URL and store it for later use
        currentNgrokUrl = decrypt(encryptedNgrokUrl, secretKey);
        console.log('Decrypted Ngrok URL:', currentNgrokUrl);

        // Acknowledge the successful reception and decryption of the ngrok URL
        res.status(200).send({ message: 'Ngrok URL received and decrypted' });
    } catch (error) {
        // Log and handle any errors in the decryption process
        console.error('Error in decrypting or processing Ngrok URL:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

// Endpoint to check the server's readiness and AI server connection status
app.get('/check-connection', (req, res) => {
    console.log('Connection check endpoint hit');

    // Logic to determine if the server is ready for a new AI server connection
    const isServerReady = true; // This should be replaced with actual logic to assess server readiness

    // Respond with the server readiness and AI server connection status
    res.json({ ready: isServerReady, aiServerConnected: isAiServerConnected });
});

// Endpoint for handling POST data reception
app.post('/check-post', (req, res) => {
    console.log('Data received:', req.body);

    // Simple acknowledgement of received data
    res.status(200).send({ message: 'Data received successfully' });
});

// Middleware function to verify the presence and validity of an API key
function verifyApiKey(req, res, next) {
    // Extract the API key from the request header
    const apiKey = req.header('Authorization');
    if (!apiKey) {
        // Respond with an error if no API key is provided
        return res.status(401).send('API Key is required');
    }

    // Query the database to validate the API key
    const tokenQuery = 'SELECT * FROM apiTokens WHERE token = ?';
    db.query(tokenQuery, [apiKey], (err, results) => {
        if (err || results.length === 0) {
            // Respond with an error if the API key is invalid or not found
            return res.status(403).send('Invalid API Key');
        }
        // If the API key is valid, proceed to the next middleware/function
        next();
    });
}

// Endpoint to generate and provide API tokens to authenticated users
app.post('/generateApiToken', (req, res) => {
    // Extract user credentials from request body
    const { userId, password, username } = req.body;

    // Query to verify user credentials in the database
    const userQuery = 'SELECT * FROM users WHERE username = ? AND password = ?';
    db.query(userQuery, [username, password], (err, userResults) => {
        if (err) {
            // Handle database errors during user credential verification
            return res.status(500).send('Error checking user credentials');
        }
        if (userResults.length === 0) {
            // Handle invalid credentials
            return res.status(401).send('Invalid credentials');
        }

        // Query to check active subscription for Developer API access
        const subscriptionQuery = 'SELECT * FROM subscriptionHistory WHERE user_id = ? AND stripe_subscription_id = ? AND status = "active"';
        db.query(subscriptionQuery, [userId, '3'], (subErr, subResults) => {
            if (subErr) {
                // Handle errors during subscription status check
                return res.status(500).send('Error checking subscription status');
            }
            if (subResults.length === 0) {
                // Handle cases where no active Developer API subscription is found
                return res.status(403).send('No active Developer API subscription found');
            }

            // Generate a unique API Token for the user
            const apiToken = crypto.randomBytes(20).toString('hex');

            // Store the generated API token in the database
            const tokenInsertQuery = 'INSERT INTO apiTokens (user_id, token, scope) VALUES (?, ?, ?)';
            db.query(tokenInsertQuery, [userId, apiToken, 'developer'], (tokenErr) => {
                if (tokenErr) {
                    // Handle errors during API token storage
                    console.error(`Error storing API token: ${tokenErr}`);
                    return res.status(500).send('Error storing API token');
                }

                // Send the generated API token back to the user
                res.json({ token: apiToken });
            });
        });
    });
});



// Define the POST endpoint '/developersAPI'. 
// This endpoint uses three middlewares: userRateLimiter, verifyApiKey, and an asynchronous handler.
app.post('/developersAPI', userRateLimiter, verifyApiKey, async (req, res) => {
    // Destructure required parameters from the request body.
    const { prompt, negative_prompt, steps, seed, width, height, cfg_scale, userId, APIKey } = req.body;

    // Validate the input parameters using a custom function. 
    // If the validation fails, send a 400 Bad Request response.
    if (!validateInput({ prompt, negative_prompt, steps, seed, width, height, cfg_scale, userId })) {
        return res.status(400).send({ error: 'Invalid input parameters' });
    }

    // Check if the provided API key matches the expected one.
    // If not, send a 403 Forbidden response indicating authentication failure.
    if (DevelopersAPIKey != APIKey) {
        return res.status(403).send('User not authenticated');
    }

    // Check if the current Ngrok URL is set (indicating the server is ready and the tunnel is established).
    // If not, send a 503 Service Unavailable response.
    if (!currentNgrokUrl) {
        return res.status(503).send({ error: 'Server not ready or ngrok tunnel not established' });
    }

    try {
        // Make an HTTP POST request to a URL (constructed using the current Ngrok URL) to generate an image.
        // The request data includes the parameters received from the client.
        const response = await axios.post(`${currentNgrokUrl}/generateImage`, {
            prompt, negative_prompt, steps, seed, width, height, cfg_scale
        });

        // Extract the imageHex (base64 encoded image) from the response.
        const imageHex = response.data.imageHex;
        // Convert the base64 encoded string to a Buffer for further processing.
        const imageBuffer = Buffer.from(imageHex, 'base64');
        // Create a readable stream from the image buffer.
        const readableStream = new Readable();
        readableStream.push(imageBuffer);
        readableStream.push(null); // Signify the end of the stream.

        // Generate a unique file name for the image using the current timestamp.
        const fileName = `image_${Date.now()}.jpeg`;
        // Define the bucket name where the image will be stored.
        const bucketName = 'aidashboardbucket';

        // Upload the image to MinIO (object storage service).
        minioClient.putObject(bucketName, fileName, readableStream, imageBuffer.length, async (err, etag) => {
            if (err) {
                // Log and return an error response if the upload fails.
                console.error(`Error uploading to MinIO: ${err}`);
                return res.status(500).send(err.message);
            }

            // Construct the URL for the uploaded image.
            const imageUrl = `https://ecstasyessentials.shop/images/${fileName}`;
            // Prepare a query to insert image details into the userGallery table.
            const insertQuery = "INSERT INTO userGallery (user_id, prompt, negative_prompt, steps, seed, width, height, cfg_scale, image_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";

            try {
                // Execute the database query to insert the image details.
                await executeDatabaseQuery(insertQuery, [userId, prompt, negative_prompt, steps, seed, width, height, cfg_scale, imageUrl]);
                // Respond with the imageHex (base64 encoded image) as JSON.
                res.json({ imageHex });
            } catch (dbErr) {
                // Log and return an error response if the database operation fails.
                console.error(`Error saving image data to database: ${dbErr}`);
                res.status(500).send('Error saving image data');
            }
        });
    } catch (error) {
        // Catch and handle any errors that occur during the image generation process.
        console.error(`Error: ${error.message}`);
        res.status(500).json({ error: error.message, message: 'Error generating image' });
    }
});



// This function executes a given SQL query with parameters and returns the results.
// It is designed to work with any kind of SQL query (SELECT, INSERT, UPDATE, etc.).
async function executeDatabaseQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        // Execute the query with the provided parameters. 
        // 'db.query' is a function from your database client library.
        db.query(query, params, (err, results) => {
            if (err) {
                // If there's an error during query execution, reject the promise with the error.
                reject(err);
            } else {
                // If the query is successful, resolve the promise with the results.
                resolve(results);
            }
        });
    });
}

// Middleware to limit the rate of requests made by a user.
async function userRateLimiter(req, res, next) {
    // Extract the userId from the request body.
    const userId = req.body.userId;
    // If userId is not provided, return a 400 Bad Request error.
    if (!userId) {
        return res.status(400).send({ error: 'User ID is required' });
    }

    try {
        // Check the current rate limit status for the user for the '/developersAPI' endpoint.
        const rateLimitStatus = await getRateLimitStatus(userId, '/developersAPI');
        // If the user has exceeded their rate limit, return a 429 Too Many Requests error.
        if (!rateLimitStatus.isAllowed) {
            return res.status(429).send({ error: 'Rate limit exceeded. Try again later.' });
        }

        // If the user has not exceeded their rate limit, proceed to the next middleware.
        next();
    } catch (error) {
        // If there's an error in the rate limiting process, log it and return a 500 Internal Server Error.
        console.error('Error in rate limiting:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
}
// This function checks the rate limit status of a user for a specific endpoint.
async function getRateLimitStatus(userId, endpoint) {
    // Query to retrieve the user's rate limit data for the specified endpoint.
    const query = 'SELECT * FROM rateLimits WHERE user_id = ? AND endpoint = ?';
    // Execute the query and store the results.
    const results = await executeDatabaseQuery(query, [userId, endpoint]);

    // If no record exists for this user and endpoint, create one and allow the request.
    if (results.length === 0) {
        await createRateLimitRecord(userId, endpoint);
        return { isAllowed: true };
    }

    // Destructure relevant fields from the first result.
    const { requests, max_requests, reset_duration, last_request } = results[0];
    // Calculate the time since the last request in seconds.
    const timeSinceLastRequest = (new Date() - last_request) / 1000;

    // If the reset duration has passed since the last request, reset the count and allow the request.
    if (timeSinceLastRequest > reset_duration) {
        await resetRateLimit(userId, endpoint);
        return { isAllowed: true };
    }

    // If the number of requests is less than the maximum allowed, increment the count and allow the request.
    if (requests < max_requests) {
        await incrementRateLimit(userId, endpoint);
        return { isAllowed: true };
    }

    // If none of the above conditions are met, the user has exceeded their rate limit.
    return { isAllowed: false };
}


// This function creates a new rate limit record for a user for a specific endpoint.
async function createRateLimitRecord(userId, endpoint) {
    // Query to insert a new record with an initial request count of 1.
    const insertQuery = 'INSERT INTO rateLimits (user_id, endpoint, requests, max_requests, reset_duration) VALUES (?, ?, 1, 1000, 3600)';
    // Execute the insert query.
    await executeDatabaseQuery(insertQuery, [userId, endpoint]);
}

// This function resets the rate limit count for a user for a specific endpoint.
async function resetRateLimit(userId, endpoint) {
    // Query to reset the request count to 1 and update the last_request timestamp.
    const updateQuery = 'UPDATE rateLimits SET requests = 1, last_request = CURRENT_TIMESTAMP WHERE user_id = ? AND endpoint = ?';
    // Execute the update query.
    await executeDatabaseQuery(updateQuery, [userId, endpoint]);
}

// This function increments the rate limit count for a user for a specific endpoint.
async function incrementRateLimit(userId, endpoint) {
    // Query to increment the request count and update the last_request timestamp.
    const updateQuery = 'UPDATE rateLimits SET requests = requests + 1, last_request = CURRENT_TIMESTAMP WHERE user_id = ? AND endpoint = ?';
    // Execute the update query.
    await executeDatabaseQuery(updateQuery, [userId, endpoint]);
}

// This function validates various input parameters received in the request body.
function validateInput({ prompt, negative_prompt, steps, seed, width, height, cfg_scale, userId }) {
    // Validation checks for each parameter.
    // Returns false if any validation fails; otherwise, returns true.
    // Add specific validation logic for each parameter as per your application requirements.
    // Example validations are shown below.
    // Validate 'prompt' - non-empty string
    if (typeof prompt !== 'string' || prompt.trim().length === 0) {
        return false;
    }

    // Validate 'negative_prompt' - non-empty string
    if (typeof negative_prompt !== 'string' || negative_prompt.trim().length === 0) {
        return false;
    }

    // Validate 'steps' - must be a number within a specific range
    const stepsRange = { min: 1, max: 100 };
    if (typeof steps !== 'number' || steps < stepsRange.min || steps > stepsRange.max) {
        return false;
    }

    // Validate 'seed' - must be a number
    if (typeof seed !== 'number') {
        return false;
    }

    // Validate 'width' and 'height' - must be numbers within specific ranges
    const dimensionRange = { min: 100, max: 4000 };
    if (typeof width !== 'number' || width < dimensionRange.min || width > dimensionRange.max) {
        return false;
    }
    if (typeof height !== 'number' || height < dimensionRange.min || height > dimensionRange.max) {
        return false;
    }

    // Validate 'cfg_scale' - must be a number within a specific range
    const cfgScaleRange = { min: 0.1, max: 15 };
    if (typeof cfg_scale !== 'number' || cfg_scale < cfgScaleRange.min || cfg_scale > cfgScaleRange.max) {
        return false;
    }

    // Validate 'userId' - must be a non-empty string or a number (depending on your user ID format)
    if (!(typeof userId === 'string' && userId.trim().length > 0) && typeof userId !== 'number') {
        return false;
    }

    return true;
}








// app.get('/dashboard', (req, res) => {
//     if (!req.session.userId) {
//         return res.redirect('/login');
//     }
//     res.render('dashboard', { userId: req.session.userId });
// });
// }

app.get('/userImages/:userId', (req, res) => {
    const userId = req.params.userId;
    const query = "SELECT * FROM userGallery WHERE user_id = ?";
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send('Error fetching images');
        }
        res.json(results);
    });
});

// app.post('/upload', upload.single('image'), (req, res) => {
//     const file = req.file;
//     const bucketName = 'aidashboardbucket'; // replace with your bucket name
//     console.log(JSON.stringify(file))
//     console.log(JSON.stringify(file.filename))
//     console.log(JSON.stringify(file.path))

//     // Upload the file to MinIO
//     minioClient.fPutObject(bucketName, file.filename, file.path, (err, etag) => {
//         if (err) return res.status(500).send(err);
//         res.send(`File uploaded successfully. ETag: ${etag}`);
//     });
// });

// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

// Express route to handle file uploads
app.post('/upload', upload.single('image'), (req, res) => {

    console.log("upload hit")
    const file = req.file;

    // Check if a file is provided in the request
    if (!file) {
        console.log("no file")
        return res.status(400).send('No file uploaded.');
    }

    // Use fs to create a read stream and get file size
    let fileStream, fileStat;
    try {
        fileStream = fs.createReadStream(file.path);
        fileStat = fs.statSync(file.path);
    } catch (error) {
        console.error(`Error reading file from disk: ${error}`);
        return res.status(500).send('Error reading file from disk.');
    }

    // Upload the file to Minio bucket
    minioClient.putObject(bucketName, file.originalname, fileStream, fileStat.size, (err, etag) => {
        if (err) {
            console.error(`Error uploading to MinIO: ${err}`);
            return res.status(500).send(err.message);
        }
        res.send(`File uploaded successfully. ETag: ${etag}`);

        // Optionally delete the file from local storage after upload
        fs.unlink(file.path, unlinkErr => {
            if (unlinkErr) {
                console.log(`Error deleting file: ${unlinkErr}`);
                console.error(`Error deleting file: ${unlinkErr}`);
            }
        });
    });
});



// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

console.log("bucket names -----------------")
// const stream2 = minioClient.listObjects('aidashboardbucket', '', true);
// stream2.on('data', function (obj) { console.log(obj); });
// stream2.on('error', function (err) { console.error(err); })

// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@




// app.get('/gallery', (req, res) => {
//     res.render('gallery.ejs');
// });

// app.post('/gallery', (req, res) => {
//     res.send('POST request to public/gallery');
// });

app.get('/about', (req, res) => {
    res.render('about.ejs');
});

app.post('/about', (req, res) => {
    res.send('POST request to public/home/about');
});

app.get('/search', (req, res) => {
    res.render('search.ejs');
});

app.post('/search', (req, res) => {
    res.send('POST request to shop/search');
});





app.get('/errorPage', (req, res) => {
    console.log("test from errorPage")
    res.render('errorPage.ejs');
});

app.post('/errorPage', (req, res) => {
    res.send('POST request to public/errorPage');
});


app.get('/adminPanel', (req, res) => {
    res.render('adminPanel.ejs');
});

app.post('/adminPanel', (req, res) => {
    res.send('POST request to admin/adminPanel');
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



app.get('/affiliate', (req, res) => {
    res.render('affiliate.ejs');
});

app.post('/affiliate', (req, res) => {
    res.send('POST request to affiliate/affiliate');
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


// Required modules
const express = require('express');
const ejs = require('ejs');
require('dotenv').config();
const mysql = require('mysql');
const multer = require('multer');
const crypto = require('crypto');
// const bodyParser = require('body-parser')
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

const bucketName = process.env.MINIO_BUCKET_NAME;


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



// app.use(session({
//     key: 'ai_dashboard_session_cookie',
//     secret: process.env.SESSION_SECRET,
//     store: sessionStore,
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//         maxAge: 86400000, // 1 day
//         httpOnly: false, // Helps prevent cross-site scripting (XSS)
//         secure: true, // Ensures the cookie is only used over HTTPS
//         sameSite: 'lax' // Can be 'strict', 'lax', or 'none'. Helps mitigate CSRF attacks
//     }
// }));




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


// Middleware and session setup

app.use(passport.initialize());
app.use(passport.session());

db.connect((err) => {
    if (err) { throw err; }
    console.log('Connected to the MySQL Server');
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

console.log("endpointSecret", endpointSecret)



app.post('/webhook', express.raw({ type: 'application/json' }), async (request, response) => {
    const sig = request.headers['stripe-signature'];

    let event;

    try {
        event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook Error:', err.message);
        response.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    console.log("Webhook received:", request.body.toString());

    if (event.type === 'checkout.session.completed') {
        const checkoutSession = event.data.object;

        const userId = checkoutSession.metadata.userId;
        const stripeSubscriptionId = checkoutSession.subscription;

        console.log("Checkout session completed for User ID:", userId);
        console.log("Stripe Subscription ID:", stripeSubscriptionId);

        const updateQuery = `
            UPDATE subscriptionHistory 
            SET status = 'active', stripe_subscription_id = ?
            WHERE user_id = ? AND status = 'pending'
        `;

        try {
            await executeDatabaseQuery(updateQuery, [stripeSubscriptionId, userId]);
            console.log(`Subscriptions updated to active for user: ${userId}`);
            response.status(200).send('Webhook processed successfully');
        } catch (err) {
            console.error('Error updating subscription status:', err);
            response.status(500).send('Error processing webhook');
        }
    } else {
        console.log(`Unhandled event type ${event.type}`);
        response.status(200).send('Received unhandled event type');
    }
});




// app.post('/webhook', express.raw({ type: 'application/json' }),
//     (request, response) => {
//         const sig = request.headers['stripe-signature'];




//         // Parse the JSON from the request body
//         const requestBody = JSON.parse(request.body.toString());

//         // Extract the userId from metadata before checking the event
//         const userId = requestBody.data.object.metadata.userId;
//         console.log("User ID:", userId);

//         console.log("request from payment", request.body.toString())
//         // Extract the userId from metadata before checking the event

//         // const userId = request.body.data.object.metadata.userId;
//         // console.log("User ID:", userId);



//         let event;


//         test = request.body.toString()

//         // Check if the event type is 'checkout.session.completed'
//         if (event.type === 'checkout.session.completed') {
//             // const checkoutSession = event.data.object;

//             // Extract the userId
//             const checkoutSession = event.data.object;
//             const userId = checkoutSession.metadata.userId;
//             console.log("User ID:", userId);

//             // Handle the checkout session completed event
//             // Here you can add code to update the user's status in your database
//             // using the extracted userId
//         }



//         try {
//             // JSON to access the Stripe event data
//             const eventJson = JSON.stringify(request.body);

//             event = stripe.webhooks.constructEvent(eventJson, sig, endpointSecret);

//             console.log("event", event)
//             console.log("event.type", event.type)


//         } catch (err) {
//             response.status(400).send(`Webhook Error: ${err.message}`);
//             return;
//         }

//         // Handle the event
//         switch (event.type) {
//             case 'checkout.session.completed':
//                 const checkoutSessionCompleted = event.data.object;
//                 console.log(checkoutSessionCompleted)

//                 // Then define and call a function to handle the event checkout.session.completed
//                 break;
//             // ... handle other event types
//             default:
//                 console.log(`Unhandled event type ${event.type}`);
//         }

//         console.log('finshed')

//         // Return a 200 response to acknowledge receipt of the event
//         // response.status(200).send(`Webhook Error: ${err.message}`);
//         response.status(200)
//         response.send();
//     });





// app.post('/webhook', express.raw({ type: 'application/json' }), async (request, response) => {
//     const sig = request.headers['stripe-signature'];

//     let event;

//     try {
//         // Construct the event using Stripe's library
//         event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
//     } catch (err) {
//         console.error('Webhook Error:', err.message);
//         return response.status(400).send(`Webhook Error: ${err.message}`);
//     }

//     // Log the entire request body for debugging
//     console.log("Webhook received:", request.body.toString());

//     if (event.type === 'checkout.session.completed') {
//         const checkoutSession = event.data.object;

//         // Extract the user ID and Stripe subscription ID from the event
//         const userId = checkoutSession.metadata.userId;
//         const stripeSubscriptionId = checkoutSession.subscription;

//         console.log("Checkout session completed for User ID:", userId);
//         console.log("Stripe Subscription ID:", stripeSubscriptionId);

//         // Update all 'pending' subscription statuses for this user to 'active'
//         const updateQuery = `
//             UPDATE subscriptionHistory 
//             SET status = 'active', stripe_subscription_id = ?
//             WHERE user_id = ? AND status = 'pending'
//         `;

//         try {
//             await executeDatabaseQuery(updateQuery, [stripeSubscriptionId, userId]);
//             console.log(`Subscriptions updated to active for user: ${userId}`);
//             response.status(200).send('Webhook processed successfully');
//         } catch (err) {
//             console.error('Error updating subscription status:', err);
//             response.status(500).send('Error processing webhook');
//         }
//     } else {
//         console.log(`Unhandled event type ${event.type}`);
//         response.status(200).send('Received unhandled event type');
//     }
// });



// Define our Polymorphic data 
app.use(express.json());
// app.use(bodyParser.json());
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
        priceID: 'price_1ORZwoIAzvGScLipp5RngcsB',
        features: ["Advanced AI model access", "Priority email support", "Developer API Access"],
        hue: 338.69, // Different HSL value for the duplicate
        saturation: 100,
        lightness: 48.04
    }
];




app.get('/product/:productId', (req, res) => {
    if (!req.session.userId) {
        // Redirect to login page if not logged in
        return res.redirect('/login');
    }
    console.log("test product/:productId")
    const product = products.find(p => p.id == req.params.productId);
    if (product) {
        res.render('productDetail', { product });
    } else {
        res.status(404).send('Product not found');
    }
});





// app.post('/checkout/:productId', async (req, res) => {
//     if (!req.session.userId) {
//         // Handle the case where the user is not logged in
//         return res.status(403).send('User not authenticated');
//     }

//     const userId = req.session.userId;
//     const productId = req.params.productId;
//     const product = products.find(p => p.id == productId);

//     if (!product) {
//         return res.status(404).send('Product not found');
//     }

//     // Set the subscription status to 'pending' in the database
//     const insertQuery = `
//         INSERT INTO subscriptionHistory (user_id, subscription_id, status)
//         VALUES (?, ?, 'pending')
//     `;
//     // Assuming you have a function to execute the query
//     try {
//         await executeDatabaseQuery(insertQuery, [userId, product.subscriptionId]);

//         // Proceed to create the Stripe session
//         const session = await stripe.checkout.sessions.create({
//             mode: 'subscription',
//             line_items: [{
//                 price: product.priceID,
//                 quantity: 1,
//             }],
//             metadata: {
//                 userId: userId.toString(),
//             },
//             success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
//             cancel_url: `${req.headers.origin}/payment-cancelled`,
//         });
//         return res.json({ url: session.url });
//     } catch (error) {
//         res.status(500).send({ error: error.message });
//     }
// });



// app.post('/checkout/:productId', async (req, res) => {
//     if (!req.session.userId) {
//         return res.status(403).send('User not authenticated');
//     }

//     const productId = parseInt(req.params.productId); // Coerce productId to a number
//     const product = products.find(p => p.id === productId);

//     if (!product) {
//         console.error(`Product with ID ${productId} not found`);
//         return res.status(404).send('Product not found');
//     }

//     try {
//         const session = await stripe.checkout.sessions.create({
//             mode: 'subscription',
//             line_items: [{
//                 price: product.priceID,
//                 quantity: 1,
//             }],
//             metadata: {
//                 userId: req.session.userId.toString(),
//             },
//             success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
//             cancel_url: `${req.headers.origin}/payment-cancelled`,
//         });

//         return res.json({ url: session.url });
//     } catch (error) {
//         console.error(`Error creating Stripe session for product ID ${productId}:`, error);
//         res.status(500).send({ error: error.message });
//     }
// });

// app.post('/checkout/:productId', async (req, res) => {
//     if (!req.session.userId) {
//         return res.status(403).send('User not authenticated');
//     }

//     const userId = req.session.userId; // Get the user ID from session
//     const productId = parseInt(req.params.productId); // Get the product ID from URL params
//     const product = products.find(p => p.id === productId);

//     if (!product) {
//         return res.status(404).send('Product not found');
//     }

//     // Assuming subscription_id is related to the product
//     const subscriptionId = product.id; // or any other logic to determine the subscription ID

//     // Insert a record into subscriptionHistory with status 'pending'
//     const insertQuery = `
//         INSERT INTO subscriptionHistory (user_id, subscription_id, status)
//         VALUES (?, ?, 'pending')
//     `;
//     try {
//         await executeDatabaseQuery(insertQuery, [userId, subscriptionId]);

//         // Create Stripe checkout session
//         const session = await stripe.checkout.sessions.create({
//             mode: 'subscription',
//             line_items: [{
//                 price: product.priceID,
//                 quantity: 1,
//             }],
//             metadata: {
//                 userId: userId.toString(),
//             },
//             success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
//             cancel_url: `${req.headers.origin}/payment-cancelled`,
//         });

//         res.json({ url: session.url });
//     } catch (error) {
//         console.error(`Error processing subscription for user ID ${userId}:`, error);
//         res.status(500).send({ error: error.message });
//     }
// });




// Function to execute a database query
function executeDatabaseQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        db.query(query, params, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

// app.post('/checkout/:productId', async (req, res) => {
//     if (!req.session.userId) {
//         return res.status(403).send('User not authenticated');
//     }

//     const userId = req.session.userId;
//     const productId = parseInt(req.params.productId);
//     const product = products.find(p => p.id === productId);

//     if (!product) {
//         return res.status(404).send('Product not found');
//     }

//     // Assuming you have a way to get the subscription ID from the product
//     // Example: const subscriptionId = getSubscriptionIdFromProduct(product);
//     // For now, I'm using the product ID itself
//     const subscriptionId = product.id;

//     const insertQuery = `
//         INSERT INTO subscriptionHistory (user_id, subscription_id, status)
//         VALUES (?, ?, 'pending')
//     `;

//     try {
//         // First, check if the user exists
//         const userCheckQuery = 'SELECT * FROM users WHERE user_id = ?';
//         const userCheckResult = await executeDatabaseQuery(userCheckQuery, [userId]);

//         if (userCheckResult.length === 0) {
//             return res.status(404).send('User not found');
//         }

//         // Then, insert the pending record
//         await executeDatabaseQuery(insertQuery, [userId, subscriptionId]);

//         // Create Stripe checkout session
//         const session = await stripe.checkout.sessions.create({
//             mode: 'subscription',
//             line_items: [{
//                 price: product.priceID,
//                 quantity: 1,
//             }],
//             metadata: {
//                 userId: userId.toString(),
//             },
//             success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
//             cancel_url: `${req.headers.origin}/payment-cancelled`,
//         });

//         res.json({ url: session.url });
//     } catch (error) {
//         console.error(`Error processing subscription for user ID ${userId}:`, error);
//         res.status(500).send({ error: error.message });
//     }
// });




app.post('/checkout/:productId', async (req, res) => {
    if (!req.session.userId) {
        return res.status(403).send('User not authenticated');
    }

    const userId = req.session.userId;
    const productId = parseInt(req.params.productId);
    const product = products.find(p => p.id === productId);

    if (!product) {
        return res.status(404).send('Product not found');
    }

    const subscriptionId = product.id; // or use a method to get the correct subscription_id

    try {
        // Check if the user exists
        const userCheckQuery = 'SELECT * FROM users WHERE user_id = ?';
        const userCheckResult = await executeDatabaseQuery(userCheckQuery, [userId]);

        if (userCheckResult.length === 0) {
            return res.status(404).send('User not found');
        }

        // Check for existing subscriptions
        const existingSubscriptionsQuery = `
            SELECT * FROM subscriptionHistory
            WHERE user_id = ? AND status = 'active'
        `;
        const existingSubscriptions = await executeDatabaseQuery(existingSubscriptionsQuery, [userId]);

        // Determine if the user is trying to subscribe to an already active subscription
        const isAlreadySubscribed = existingSubscriptions.some(sub => sub.subscription_id === subscriptionId);

        if (isAlreadySubscribed) {
            return res.status(409).send('You are already subscribed to this plan');
        }

        // Here you can handle subscription upgrades or other logic

        // Insert a new pending subscription record
        const insertQuery = `
            INSERT INTO subscriptionHistory (user_id, subscription_id, status)
            VALUES (?, ?, 'pending')
        `;
        await executeDatabaseQuery(insertQuery, [userId, subscriptionId]);

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            line_items: [{
                price: product.priceID,
                quantity: 1,
            }],
            metadata: {
                userId: userId.toString(),
            },
            success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}/payment-cancelled`,
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error(`Error processing subscription for user ID ${userId}:`, error);
        res.status(500).send({ error: error.message });
    }
});




// app.post('/checkout/:productId', async (req, res) => {
//     if (!req.session.userId) {
//         return res.status(403).send('User not authenticated');
//     }

//     const userId = req.session.userId;
//     const productId = parseInt(req.params.productId);
//     const product = products.find(p => p.id === productId);

//     if (!product) {
//         return res.status(404).send('Product not found');
//     }

//     // Determine the subscription plan ID related to the product
//     const subscriptionId = product.id; // Example logic

//     const insertQuery = `
//         INSERT INTO subscriptionHistory (user_id, subscription_id, status)
//         VALUES (?, ?, 'pending')
//     `;

//     try {
//         await executeDatabaseQuery(insertQuery, [userId, subscriptionId]);

//         const session = await stripe.checkout.sessions.create({
//             mode: 'subscription',
//             line_items: [{
//                 price: product.priceID,
//                 quantity: 1,
//             }],
//             metadata: {
//                 userId: userId.toString(),
//             },
//             success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
//             cancel_url: `${req.headers.origin}/payment-cancelled`,
//         });

//         res.json({ url: session.url });
//     } catch (error) {
//         console.error(`Error processing subscription for user ID ${userId}:`, error);
//         res.status(500).send({ error: error.message });
//     }
// });


// app.post('/checkout/:productId', async (req, res) => {



//     const product = products.find(p => p.id == req.body.productId);
//     if (!product) {
//         return res.status(404).send('Product not found');
//     }

//     try {
//         const session = await stripe.checkout.sessions.create({
//             mode: 'subscription',
//             line_items: [{
//                 price: product.priceID,
//                 quantity: 1,
//             }],
//             metadata: {
//                 userId: req.session.userId.toString(),
//             },
//             success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
//             cancel_url: `${req.headers.origin}/payment-cancelled`,
//         });
//         return res.json({ url: session.url });
//     } catch (error) {
//         res.status(500).send({ error: error.message });
//     }
// });

console.log("session", JSON.stringify(session))

//         // Retrieve the user by email and update their subscription status
//         try {
//             const userEmail = session.customer_email;
//             const subscriptionId = session.subscription; // This is the Stripe subscription ID

//             const updateQuery = 'UPDATE users SET subscription_id = ? WHERE email = ?';
//             await db.promise().query(updateQuery, [subscriptionId, userEmail]);

//             console.log(`Subscription updated for user: ${userEmail}`);
//         } catch (updateError) {
//             console.error('Error updating user subscription:', updateError);
//         }
//     }

//     // Return a response to acknowledge receipt of the event
//     res.json({ received: true });
// });



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

// app.post('/login', [
//     body('username')
//         .trim()
//         .escape()
//         .isLength({ min: 2, max: 20 }).withMessage('Username must be between 2 to 20 characters.')
//         .matches(/^[A-Za-z0-9_]+$/).withMessage('Username must be alphanumeric with underscores.'),
//     body('password')
//         .trim()
//         .escape()
//         .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
// ], (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         const errorMessages = errors.array().map(error => ({ parameter: error.param, message: error.msg, value: error.value }));
//         return res.render('login.ejs', { errors: errorMessages });
//     }

//     const { username, password } = req.body;
//     const sqlquery = "SELECT user_id, password FROM users WHERE username = ?";

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
//                 req.session.userId = results[0].user_id;
//                 req.session.save(err => {
//                     if (err) {
//                         // Handle error
//                         console.log("there was a error after match", err)
//                     }
//                     res.redirect('/userProfile');
//                 });
//             } else {
//                 // Handle login failure
//                 res.render('login.ejs', { errors: [{ message: 'Invalid username or password.' }] });
//             }



//             if (isMatch) {
//                 req.session.userId = results[0].user_id;  // Assuming 'user_id' is the field name in your database
//                 req.session.save(err => {
//                     if (err) {
//                         // Handle error
//                         console.log("there was a error after match", err)
//                     }

//                     // req.session.userId = results[0].user_id;  // Assuming 'user_id' is the field name in your database
//                     res.redirect('/userProfile'); // Redirect to the user's profile or dashboard
//                 });

//             } else {
//                 res.render('login.ejs', { errors: [{ message: 'Invalid username or password.' }] });
//             }
//         });
//     });
// });

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
                req.session.save(err => {
                    if (err) {
                        console.error("Error saving session:", err);
                        return res.render('login.ejs', { errors: [{ message: 'Error logging in.' }] });
                    }
                    res.redirect('/userProfile');
                });
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



app.get('/userProfile', async (req, res) => {
    console.log('req.sessionID => Session ID:', req.sessionID);
    console.log('req.session => Session Data userId:', req.session);
    console.log('req.session.userId => Session Data userId:', req.session.userId);
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




app.post('/', async (req, res) => {
    const { prompt, negative_prompt, steps, seed, width, height, cfg_scale } = req.body;
    try {
        const response = await axios.post('https://a0f8-147-12-195-79.ngrok-free.app/generateImage', {
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


// This is going to be the dashboard
app.post('/dashboard', async (req, res) => {
    const { prompt, negative_prompt, steps, seed, width, height, cfg_scale } = req.body;
    try {
        const response = await axios.post('https://a0f8-147-12-195-79.ngrok-free.app/generateImage', {
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

// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

function dataURLtoFile(dataurl, filename) {

    var arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);

    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
}

//Usage example:
var file = dataURLtoFile('data:text/plain;base64,aGVsbG8gd29ybGQ=', 'hello.txt');
console.log(file);


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
});



// Endpoint to list all images in a bucket
app.get('/images', (req, res) => {
    const bucketName = 'aidashboardbucket';
    console.log("imagesss-------------");

    const objects = [];

    minioClient.listObjectsV2(bucketName, '', true, "1000")
        .on("error", error => {
            console.log(error)
            return res.status(500).send(error)
        })
        .on('data', data => {
            // console.log("data")
            objects.push(data)
        })
        .on('end', () => {
            console.log("end")
            let html = '<h1>Images</h1>';
            console.log(objects)
            objects.forEach(file => {
                html += `<div><img src="/images/${file.name}" style="width:200px;"><p>${file.name}</p></div>`;
            });
            res.send(html);
        })
});



app.get('/images/:imageName', (req, res) => {
    const bucketName = 'aidashboardbucket';
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
















// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@






















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



// s
// metadata: { userId: req.session.userId },
// metadata: { userId: req.session.userId.toString() },

// const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;


// app.post('/webhook', express.raw({ type: 'application/json' }), async (request, response) => {
//     const sig = request.headers['stripe-signature'];

//     let event;

//     try {
//         event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
//     } catch (err) {
//         response.status(400).send(`Webhook Error: ${err.message}`);
//         return;
//     }

//     // Handle the checkout.session.completed event
//     if (event.type === 'checkout.session.completed') {
//         const session = event.data.object;
//         console.log("session", JSON.stringify(session))

//         // Assuming the user's ID is passed in the metadata
//         const userId = session.metadata.userId;
//         const stripeSubscriptionId = session.subscription;



//         // Update the subscriptionHistory table
//         const updateQuery = "UPDATE subscriptionHistory SET status = 'active', stripe_subscription_id = ?, end_date = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 MONTH) WHERE user_id = ? AND status = 'pending'";
//         // Execute the query to update the database
//         // Add your database query execution logic here

//         console.log(`Subscription activated for user: ${userId}`);
//     }

//     // Other event types can be handled here

//     response.send();
// });
// app.post('/webhook', express.raw({ type: 'application/json' }), async (request, response) => {
//     console.log("request from payment", request.body)
//     const sig = request.headers['stripe-signature'];

//     let event;

//     try {
//         event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
//     } catch (err) {
//         response.status(400).send(`Webhook Error: ${err.message}`);
//         return;
//     }

//     // Handle the checkout.session.completed event
//     if (event.type === 'checkout.session.completed') {
//         const session = event.data.object;

//         // Assuming the user's ID is passed in the metadata
//         const userId = session.metadata.userId;
//         const stripeSubscriptionId = session.subscription;

//         // Update the subscriptionHistory table
//         const updateQuery = "UPDATE subscriptionHistory SET status = 'active', stripe_subscription_id = ?, end_date = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 MONTH) WHERE user_id = ? AND status = 'pending'";
//         // Execute the query to update the database
//         // Add your database query execution logic here

//         console.log(`Subscription activated for user: ${userId}`);
//     }

//     // Other event types can be handled here

//     response.send();
// });



// app.post('/webhook', express.raw({ type: 'application/json' }), (request, response) => {console.log("Raw request body: --------------------------------------------", request.body);
//     
//     try {
//         const event = stripe.webhooks.constructEvent(request.body, request.headers['stripe-signature'], endpointSecret);
//         console.log('Event:', event);
//     } catch (err) {
//         console.error('Error:', err.message);
//         return response.status(400).send(`Webhook Error: ${err.message}`);
//     }
//     response.json({ received: true });
// });
// app.post('/webhook', express.raw({ type: 'application/json' }), (request, response) => {
//     console.log("Raw request body: --------------------------------------------", JSON.stringify(request.body));
//     const sig = request.headers['stripe-signature'];

//     let event;

//     try {
//         event = stripe.webhooks.constructEvent(JSON.stringify(request.body), sig, endpointSecret);
//     } catch (err) {
//         response.status(400).send(`Webhook Error: ${err.message}`);
//         return;
//     }

//     // Handle the event
//     switch (event.type) {
//         case 'checkout.session.completed':
//             const checkoutSessionCompleted = event.data.object;
//             // Then define and call a function to handle the event checkout.session.completed
//             break;
//         // ... handle other event types
//         default:
//             console.log(`Unhandled event type ${event.type}`);
//     }

//     // Return a 200 response to acknowledge receipt of the event
//     response.send();
// });






// Middleware to handle raw request body for Stripe

// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// app.post('/webhook', express.raw({ type: 'application/json' }), (request, response) => {

//     const sig = request.headers['stripe-signature'];

//     let event;
//     console.log("Raw request body: @@@@@@@", JSON.stringify(request.body));
//     try {
//         event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
//     } catch (err) {
//         response.status(400).send(`Webhook Error: ${err.message}`);
//         return;
//     }

//     // Handle the event
//     switch (event.type) {
//         case 'checkout.session.completed':
//             const checkoutSessionCompleted = event.data.object;
//             console.log(checkoutSessionCompleted)
//             // Then define and call a function to handle the event checkout.session.completed
//             break;
//         // ... handle other event types
//         default:
//             console.log(`Unhandled event type ${event.type}`);
//     }

//     // Return a 200 response to acknowledge receipt of the event
//     response.send();
// });


// function logMetadataWithUserId(obj) {
//     if (typeof obj === 'object' && obj !== null) {
//         for (const key in obj) {
//             if (key === 'metadata' && obj[key].hasOwnProperty('userId')) {
//                 const userIdValue = obj[key]['userId'];
//                 if (/^\d+$/.test(userIdValue)) {
//                     console.log('Found metadata with userId:', obj[key]);
//                 }
//             } else if (typeof obj[key] === 'object') {
//                 logMetadataWithUserId(obj[key]); // Recursively search in nested objects
//             }
//         }
//     }
// }


// function logMetadata(obj) {
//     console.log("obj", obj)
//     if (typeof obj === 'object' && obj !== null) {
//         for (const key in obj) {
//             if (key === 'metadata') {
//                 console.log('Metadata found:', obj[key]);
//             } else if (typeof obj[key] === 'object') {
//                 logMetadata(obj[key]); // Recursively search in nested objects
//             }
//         }
//     }
// }

// app.post('/webhook', express.raw({ type: 'application/json' }), (request, response) => {
//     const sig = request.headers['stripe-signature'];
//     let event;

//     // console.log("Raw request body: @@@@@@@", JSON.stringify(request.body));

//     testpars = JSON.stringify(request.body)
//     logMetadata(testpars)
//     // logMetadataWithUserId(testpars)

//     try {
//         event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
//     } catch (err) {
//         response.status(400).send(`Webhook Error: ${err.message}`);
//         return;
//     }

//     // Check if the event data object contains non-empty metadata
//     if (event.data && event.data.object && Object.keys(event.data.object.metadata).length > 0) {
//         console.log("Event with metadata:", event.data.object);
//     }

//     // Handle the event
//     switch (event.type) {
//         case 'checkout.session.completed':
//             const checkoutSessionCompleted = event.data.object;
//             console.log(checkoutSessionCompleted);
//             // Define and call a function to handle the event checkout.session.completed
//             break;
//         // ... handle other event types
//         default:
//             console.log(`Unhandled event type ${event.type}`);
//     }

//     // Return a 200 response to acknowledge receipt of the event
//     response.send();
// });



// Improved logMetadata function to handle nested objects
// function logMetadata(obj) {
//     if (obj !== null && typeof obj === 'object') {
//         for (const key in obj) {
//             if (obj.hasOwnProperty(key)) {
//                 if (key === 'metadata' && Object.keys(obj[key]).length > 0) {
//                     console.log('Metadata found:', obj[key]);
//                 } else if (typeof obj[key] === 'object') {
//                     logMetadata(obj[key]); // Recursively search in nested objects
//                 }
//             }
//         }
//     }
// }






// app.post('/webhook', express.raw({ type: 'application/json' }), (request, response) => {

//     console.log("Raw request body: @@@@@@@", JSON.stringify(request.body));

//     const sig = request.headers['stripe-signature'];

//     let event;

//     try {
//         event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);


//     } catch (err) {
//         response.status(400).send(`Webhook Error: ${err.message}`);
//         return;
//     }

//     // Handle the event
//     switch (event.type) {
//         case 'checkout.session.completed':
//             const checkoutSessionCompleted = event.data.object;
//             // Then define and call a function to handle the event checkout.session.completed
//             break;
//         // ... handle other event types
//         default:
//             console.log(`Unhandled event type ${event.type}`);
//     }

//     // Return a 200 response to acknowledge receipt of the event
//     response.send();
// });
// app.post('/webhook', (req, res) => {
//     try {
//         // Assuming the body data is sent as a JSON string in a buffer
//         const buffer = req.body;
//         const data = JSON.parse(buffer.toString());

//         // Filter for 'checkout.session.completed' events
//         if (data.type === 'checkout.session.completed') {
//             // Process and save data
//             saveDataToFile(data);
//         }

//         res.status(200).send('Webhook received!');
//     } catch (error) {
//         console.error('Error:', error);
//         res.status(400).send('Webhook error');
//     }
// });

// function saveDataToFile(data) {
//     const filePath = 'stripe_data.json';
//     // Append data to a file or create a new file if it doesn't exist
//     fs.appendFile(filePath, JSON.stringify(data, null, 2), (err) => {
//         if (err) throw err;
//         console.log('Data saved to file:', filePath);
//     });
// }

// app.post('/webhook', express.raw({ type: 'application/json' }), (request, response) => {

//     testpars = JSON.stringify(request.body)
//     console.log(testpars)


//     logMetadata(testpars)
//     // Log metadata if present
//     // logMetadata(event);

//     const sig = request.headers['stripe-signature'];
//     let event;


//     try {
//         // Construct the event using the raw body and signature
//         event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
//     } catch (err) {
//         response.status(400).send(`Webhook Error: ${err.message}`);
//         return;
//     }



//     // Handle the event
//     switch (event.type) {
//         case 'checkout.session.completed':
//             // Process the checkout session completed event
//             const checkoutSessionCompleted = event.data.object;
//             console.log(checkoutSessionCompleted);
//             // Further processing here
//             break;
//         // ... handle other event types
//         default:
//             console.log(`Unhandled event type ${event.type}`);
//     }

//     // Return a 200 response to acknowledge receipt of the event
//     response.sendStatus(200);
// });



// This is your Stripe CLI webhook secret for testing your endpoint locally.
// Webhook Error: Webhook payload must be provided as a string or a Buffer(https://nodejs.org/api/buffer.html) instance representing the _raw_ request body.Payload was provided as a parsed JavaScript object instead. 
//     Signature verification is impossible without access to the original signed material. 
// Learn more about webhook signing and explore webhook integration examples for various frameworks at https://github.com/stripe/stripe-node#webhook-signing
// app.post('/webhook', bodyParser.raw({ type: 'application/json' }), (request, response) => {
//     console.log("request from payment", request.body)
//     const sig = request.headers['stripe-signature'];

//     let event;

//     try {
//         event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
//         // Further handling based on event type
//     } catch (err) {
//         response.status(400).send(`Webhook Error: ${err.message}`);
//         return;
//     }

//     // Handle the event
//     switch (event.type) {
//         case 'account.updated':
//             const accountUpdated = event.data.object;
//             console.log("accountUpdated", JSON.stringify(accountUpdated))
//             // Then define and call a function to handle the event account.updated
//             break;
//         case 'account.external_account.created':
//             const accountExternalAccountCreated = event.data.object;
//             console.log("accountExternalAccountCreated", JSON.stringify(accountExternalAccountCreated))
//             // Then define and call a function to handle the event account.external_account.created
//             break;
//         case 'account.external_account.deleted':
//             const accountExternalAccountDeleted = event.data.object;
//             console.log("accountExternalAccountDeleted", JSON.stringify(accountExternalAccountDeleted))
//             // Then define and call a function to handle the event account.external_account.deleted
//             break;
//         case 'account.external_account.updated':
//             const accountExternalAccountUpdated = event.data.object;
//             console.log("accountExternalAccountUpdated", JSON.stringify(accountExternalAccountUpdated))
//             // Then define and call a function to handle the event account.external_account.updated
//             break;
//         case 'balance.available':
//             const balanceAvailable = event.data.object;
//             console.log("balanceAvailable", JSON.stringify(balanceAvailable))
//             // Then define and call a function to handle the event balance.available
//             break;
//         case 'billing_portal.configuration.created':
//             const billingPortalConfigurationCreated = event.data.object;
//             console.log("billingPortalConfigurationCreated", JSON.stringify(billingPortalConfigurationCreated))
//             // Then define and call a function to handle the event billing_portal.configuration.created
//             break;
//         case 'billing_portal.configuration.updated':
//             const billingPortalConfigurationUpdated = event.data.object;
//             console.log("billingPortalConfigurationUpdated", JSON.stringify(billingPortalConfigurationUpdated))
//             // Then define and call a function to handle the event billing_portal.configuration.updated
//             break;
//         case 'billing_portal.session.created':
//             const billingPortalSessionCreated = event.data.object;
//             console.log("billingPortalSessionCreated", JSON.stringify(billingPortalSessionCreated))
//             // Then define and call a function to handle the event billing_portal.session.created
//             break;
//         case 'capability.updated':
//             const capabilityUpdated = event.data.object;
//             console.log("capabilityUpdated", JSON.stringify(capabilityUpdated))
//             // Then define and call a function to handle the event capability.updated
//             break;
//         case 'cash_balance.funds_available':
//             const cashBalanceFundsAvailable = event.data.object;
//             console.log("cashBalanceFundsAvailable", JSON.stringify(cashBalanceFundsAvailable))
//             // Then define and call a function to handle the event cash_balance.funds_available
//             break;
//         case 'charge.captured':
//             const chargeCaptured = event.data.object;
//             console.log("chargeCaptured", JSON.stringify(chargeCaptured))
//             // Then define and call a function to handle the event charge.captured
//             break;
//         case 'charge.expired':
//             const chargeExpired = event.data.object;
//             console.log("chargeExpired", JSON.stringify(chargeExpired))
//             // Then define and call a function to handle the event charge.expired
//             break;
//         case 'charge.failed':
//             const chargeFailed = event.data.object;
//             console.log("chargeFailed", JSON.stringify(chargeFailed))
//             // Then define and call a function to handle the event charge.failed
//             break;
//         case 'charge.pending':
//             const chargePending = event.data.object;
//             console.log("chargePending", JSON.stringify(chargePending))
//             // Then define and call a function to handle the event charge.pending
//             break;
//         case 'charge.refunded':
//             const chargeRefunded = event.data.object;
//             console.log("chargeRefunded", JSON.stringify(chargeRefunded))
//             // Then define and call a function to handle the event charge.refunded
//             break;
//         case 'charge.succeeded':
//             const chargeSucceeded = event.data.object;
//             console.log("chargeSucceeded", JSON.stringify(chargeSucceeded))
//             // Then define and call a function to handle the event charge.succeeded
//             break;
//         case 'charge.updated':
//             const chargeUpdated = event.data.object;
//             console.log("chargeUpdated", JSON.stringify(chargeUpdated))
//             // Then define and call a function to handle the event charge.updated
//             break;
//         case 'charge.dispute.closed':
//             const chargeDisputeClosed = event.data.object;
//             console.log("chargeDisputeClosed", JSON.stringify(chargeDisputeClosed))
//             // Then define and call a function to handle the event charge.dispute.closed
//             break;
//         case 'charge.dispute.created':
//             const chargeDisputeCreated = event.data.object;
//             console.log("chargeDisputeCreated", JSON.stringify(chargeDisputeCreated))
//             // Then define and call a function to handle the event charge.dispute.created
//             break;
//         case 'charge.dispute.funds_reinstated':
//             const chargeDisputeFundsReinstated = event.data.object;
//             console.log("chargeDisputeFundsReinstated", JSON.stringify(chargeDisputeFundsReinstated))
//             // Then define and call a function to handle the event charge.dispute.funds_reinstated
//             break;
//         case 'charge.dispute.funds_withdrawn':
//             const chargeDisputeFundsWithdrawn = event.data.object;
//             console.log("chargeDisputeFundsWithdrawn", JSON.stringify(chargeDisputeFundsWithdrawn))
//             // Then define and call a function to handle the event charge.dispute.funds_withdrawn
//             break;
//         case 'charge.dispute.updated':
//             const chargeDisputeUpdated = event.data.object;
//             console.log("chargeDisputeUpdated", JSON.stringify(chargeDisputeUpdated))
//             // Then define and call a function to handle the event charge.dispute.updated
//             break;
//         case 'charge.refund.updated':
//             const chargeRefundUpdated = event.data.object;
//             console.log("chargeRefundUpdated", JSON.stringify(chargeRefundUpdated))
//             // Then define and call a function to handle the event charge.refund.updated
//             break;
//         case 'checkout.session.async_payment_failed':
//             const checkoutSessionAsyncPaymentFailed = event.data.object;
//             console.log("checkoutSessionAsyncPaymentFailed", JSON.stringify(checkoutSessionAsyncPaymentFailed))
//             // Then define and call a function to handle the event checkout.session.async_payment_failed
//             break;
//         case 'checkout.session.async_payment_succeeded':
//             const checkoutSessionAsyncPaymentSucceeded = event.data.object;
//             console.log("checkoutSessionAsyncPaymentSucceeded", JSON.stringify(checkoutSessionAsyncPaymentSucceeded))
//             // Then define and call a function to handle the event checkout.session.async_payment_succeeded
//             break;
//         case 'checkout.session.completed':
//             const checkoutSessionCompleted = event.data.object;
//             console.log("checkoutSessionCompleted", JSON.stringify(checkoutSessionCompleted))
//             // Then define and call a function to handle the event checkout.session.completed
//             break;
//         case 'checkout.session.expired':
//             const checkoutSessionExpired = event.data.object;
//             console.log("checkoutSessionExpired", JSON.stringify(checkoutSessionExpired))
//             // Then define and call a function to handle the event checkout.session.expired
//             break;
//         case 'climate.order.canceled':
//             const climateOrderCanceled = event.data.object;
//             console.log("climateOrderCanceled", JSON.stringify(climateOrderCanceled))
//             // Then define and call a function to handle the event climate.order.canceled
//             break;
//         case 'climate.order.created':
//             const climateOrderCreated = event.data.object;
//             console.log("climateOrderCreated", JSON.stringify(climateOrderCreated))
//             // Then define and call a function to handle the event climate.order.created
//             break;
//         case 'climate.order.delayed':
//             const climateOrderDelayed = event.data.object;
//             console.log("climateOrderDelayed", JSON.stringify(climateOrderDelayed))
//             // Then define and call a function to handle the event climate.order.delayed
//             break;
//         case 'climate.order.delivered':
//             const climateOrderDelivered = event.data.object;
//             console.log("climateOrderDelivered", JSON.stringify(climateOrderDelivered))
//             // Then define and call a function to handle the event climate.order.delivered
//             break;
//         case 'climate.order.product_substituted':
//             const climateOrderProductSubstituted = event.data.object;
//             console.log("climateOrderProductSubstituted", JSON.stringify(climateOrderProductSubstituted))
//             // Then define and call a function to handle the event climate.order.product_substituted
//             break;
//         case 'climate.product.created':
//             const climateProductCreated = event.data.object;
//             console.log("climateProductCreated", JSON.stringify(climateProductCreated))
//             // Then define and call a function to handle the event climate.product.created
//             break;
//         case 'climate.product.pricing_updated':
//             const climateProductPricingUpdated = event.data.object;
//             console.log("climateProductPricingUpdated", JSON.stringify(climateProductPricingUpdated))
//             // Then define and call a function to handle the event climate.product.pricing_updated
//             break;
//         case 'credit_note.created':
//             const creditNoteCreated = event.data.object;
//             console.log("creditNoteCreated", JSON.stringify(creditNoteCreated))
//             // Then define and call a function to handle the event credit_note.created
//             break;
//         case 'credit_note.updated':
//             const creditNoteUpdated = event.data.object;
//             console.log("creditNoteUpdated", JSON.stringify(creditNoteUpdated))
//             // Then define and call a function to handle the event credit_note.updated
//             break;
//         case 'credit_note.voided':
//             const creditNoteVoided = event.data.object;
//             console.log("creditNoteVoided", JSON.stringify(creditNoteVoided))
//             // Then define and call a function to handle the event credit_note.voided
//             break;
//         case 'customer.created':
//             const customerCreated = event.data.object;
//             console.log("customerCreated", JSON.stringify(customerCreated))
//             // Then define and call a function to handle the event customer.created
//             break;
//         case 'customer.deleted':
//             const customerDeleted = event.data.object;
//             console.log("customerDeleted", JSON.stringify(customerDeleted))
//             // Then define and call a function to handle the event customer.deleted
//             break;
//         case 'customer.updated':
//             const customerUpdated = event.data.object;
//             console.log("customerUpdated", JSON.stringify(customerUpdated))
//             // Then define and call a function to handle the event customer.updated
//             break;
//         case 'customer.discount.created':
//             const customerDiscountCreated = event.data.object;
//             console.log("customerDiscountCreated", JSON.stringify(customerDiscountCreated))
//             // Then define and call a function to handle the event customer.discount.created
//             break;
//         case 'customer.discount.deleted':
//             const customerDiscountDeleted = event.data.object;
//             console.log("customerDiscountDeleted", JSON.stringify(customerDiscountDeleted))
//             // Then define and call a function to handle the event customer.discount.deleted
//             break;
//         case 'customer.discount.updated':
//             const customerDiscountUpdated = event.data.object;
//             console.log("customerDiscountUpdated", JSON.stringify(customerDiscountUpdated))
//             // Then define and call a function to handle the event customer.discount.updated
//             break;
//         case 'customer.source.created':
//             const customerSourceCreated = event.data.object;
//             console.log("customerSourceCreated", JSON.stringify(customerSourceCreated))
//             // Then define and call a function to handle the event customer.source.created
//             break;
//         case 'customer.source.deleted':
//             const customerSourceDeleted = event.data.object;
//             console.log("customerSourceDeleted", JSON.stringify(customerSourceDeleted))
//             // Then define and call a function to handle the event customer.source.deleted
//             break;
//         case 'customer.source.expiring':
//             const customerSourceExpiring = event.data.object;
//             console.log("customerSourceExpiring", JSON.stringify(customerSourceExpiring))
//             // Then define and call a function to handle the event customer.source.expiring
//             break;
//         case 'customer.source.updated':
//             const customerSourceUpdated = event.data.object;
//             console.log("customerSourceUpdated", JSON.stringify(customerSourceUpdated))
//             // Then define and call a function to handle the event customer.source.updated
//             break;
//         case 'customer.subscription.created':
//             const customerSubscriptionCreated = event.data.object;
//             console.log("customerSubscriptionCreated", JSON.stringify(customerSubscriptionCreated))
//             // Then define and call a function to handle the event customer.subscription.created
//             break;
//         case 'customer.subscription.deleted':
//             const customerSubscriptionDeleted = event.data.object;
//             console.log("customerSubscriptionDeleted", JSON.stringify(customerSubscriptionDeleted))
//             // Then define and call a function to handle the event customer.subscription.deleted
//             break;
//         case 'customer.subscription.paused':
//             const customerSubscriptionPaused = event.data.object;
//             console.log("customerSubscriptionPaused", JSON.stringify(customerSubscriptionPaused))
//             // Then define and call a function to handle the event customer.subscription.paused
//             break;
//         case 'customer.subscription.pending_update_applied':
//             const customerSubscriptionPendingUpdateApplied = event.data.object;
//             console.log("customerSubscriptionPendingUpdateApplied", JSON.stringify(customerSubscriptionPendingUpdateApplied))
//             // Then define and call a function to handle the event customer.subscription.pending_update_applied
//             break;
//         case 'customer.subscription.pending_update_expired':
//             const customerSubscriptionPendingUpdateExpired = event.data.object;
//             console.log("customerSubscriptionPendingUpdateExpired", JSON.stringify(customerSubscriptionPendingUpdateExpired))
//             // Then define and call a function to handle the event customer.subscription.pending_update_expired
//             break;
//         case 'customer.subscription.resumed':
//             const customerSubscriptionResumed = event.data.object;
//             console.log("customerSubscriptionResumed", JSON.stringify(customerSubscriptionResumed))
//             // Then define and call a function to handle the event customer.subscription.resumed
//             break;
//         case 'customer.subscription.trial_will_end':
//             const customerSubscriptionTrialWillEnd = event.data.object;
//             console.log("customerSubscriptionTrialWillEnd", JSON.stringify(customerSubscriptionTrialWillEnd))
//             // Then define and call a function to handle the event customer.subscription.trial_will_end
//             break;
//         case 'customer.subscription.updated':
//             const customerSubscriptionUpdated = event.data.object;
//             console.log("customerSubscriptionUpdated", JSON.stringify(customerSubscriptionUpdated))
//             // Then define and call a function to handle the event customer.subscription.updated
//             break;
//         case 'customer.tax_id.created':
//             const customerTaxIdCreated = event.data.object;
//             console.log("customerTaxIdCreated", JSON.stringify(customerTaxIdCreated))
//             // Then define and call a function to handle the event customer.tax_id.created
//             break;
//         case 'customer.tax_id.deleted':
//             const customerTaxIdDeleted = event.data.object;
//             console.log("customerTaxIdDeleted", JSON.stringify(customerTaxIdDeleted))
//             // Then define and call a function to handle the event customer.tax_id.deleted
//             break;
//         case 'customer.tax_id.updated':
//             const customerTaxIdUpdated = event.data.object;
//             console.log("customerTaxIdUpdated", JSON.stringify(customerTaxIdUpdated))
//             // Then define and call a function to handle the event customer.tax_id.updated
//             break;
//         case 'customer_cash_balance_transaction.created':
//             const customerCashBalanceTransactionCreated = event.data.object;
//             console.log("customerCashBalanceTransactionCreated", JSON.stringify(customerCashBalanceTransactionCreated))
//             // Then define and call a function to handle the event customer_cash_balance_transaction.created
//             break;
//         case 'file.created':
//             const fileCreated = event.data.object;
//             console.log("fileCreated", JSON.stringify(fileCreated))
//             // Then define and call a function to handle the event file.created
//             break;
//         case 'financial_connections.account.created':
//             const financialConnectionsAccountCreated = event.data.object;
//             console.log("financialConnectionsAccountCreated", JSON.stringify(financialConnectionsAccountCreated))
//             // Then define and call a function to handle the event financial_connections.account.created
//             break;
//         case 'financial_connections.account.deactivated':
//             const financialConnectionsAccountDeactivated = event.data.object;
//             console.log("financialConnectionsAccountDeactivated", JSON.stringify(financialConnectionsAccountDeactivated))
//             // Then define and call a function to handle the event financial_connections.account.deactivated
//             break;
//         case 'financial_connections.account.disconnected':
//             const financialConnectionsAccountDisconnected = event.data.object;
//             console.log("financialConnectionsAccountDisconnected", JSON.stringify(financialConnectionsAccountDisconnected))
//             // Then define and call a function to handle the event financial_connections.account.disconnected
//             break;
//         case 'financial_connections.account.reactivated':
//             const financialConnectionsAccountReactivated = event.data.object;
//             console.log("financialConnectionsAccountReactivated", JSON.stringify(financialConnectionsAccountReactivated))
//             // Then define and call a function to handle the event financial_connections.account.reactivated
//             break;
//         case 'financial_connections.account.refreshed_balance':
//             const financialConnectionsAccountRefreshedBalance = event.data.object;
//             console.log("financialConnectionsAccountRefreshedBalance", JSON.stringify(financialConnectionsAccountRefreshedBalance))
//             // Then define and call a function to handle the event financial_connections.account.refreshed_balance
//             break;
//         case 'financial_connections.account.refreshed_transactions':
//             const financialConnectionsAccountRefreshedTransactions = event.data.object;
//             console.log("financialConnectionsAccountRefreshedTransactions", JSON.stringify(financialConnectionsAccountRefreshedTransactions))
//             // Then define and call a function to handle the event financial_connections.account.refreshed_transactions
//             break;
//         case 'identity.verification_session.canceled':
//             const identityVerificationSessionCanceled = event.data.object;
//             console.log("identityVerificationSessionCanceled", JSON.stringify(identityVerificationSessionCanceled))
//             // Then define and call a function to handle the event identity.verification_session.canceled
//             break;
//         case 'identity.verification_session.created':
//             const identityVerificationSessionCreated = event.data.object;
//             console.log("identityVerificationSessionCreated", JSON.stringify(identityVerificationSessionCreated))
//             // Then define and call a function to handle the event identity.verification_session.created
//             break;
//         case 'identity.verification_session.processing':
//             const identityVerificationSessionProcessing = event.data.object;
//             console.log("identityVerificationSessionProcessing", JSON.stringify(identityVerificationSessionProcessing))
//             // Then define and call a function to handle the event identity.verification_session.processing
//             break;
//         case 'identity.verification_session.redacted':
//             const identityVerificationSessionRedacted = event.data.object;
//             console.log("identityVerificationSessionRedacted", JSON.stringify(identityVerificationSessionRedacted))
//             // Then define and call a function to handle the event identity.verification_session.redacted
//             break;
//         case 'identity.verification_session.requires_input':
//             const identityVerificationSessionRequiresInput = event.data.object;
//             console.log("identityVerificationSessionRequiresInput", JSON.stringify(identityVerificationSessionRequiresInput))
//             // Then define and call a function to handle the event identity.verification_session.requires_input
//             break;
//         case 'identity.verification_session.verified':
//             const identityVerificationSessionVerified = event.data.object;
//             console.log("identityVerificationSessionVerified", JSON.stringify(identityVerificationSessionVerified))
//             // Then define and call a function to handle the event identity.verification_session.verified
//             break;
//         case 'invoice.created':
//             const invoiceCreated = event.data.object;
//             console.log("invoiceCreated", JSON.stringify(invoiceCreated))
//             // Then define and call a function to handle the event invoice.created
//             break;
//         case 'invoice.deleted':
//             const invoiceDeleted = event.data.object;
//             console.log("invoiceDeleted", JSON.stringify(invoiceDeleted))
//             // Then define and call a function to handle the event invoice.deleted
//             break;
//         case 'invoice.finalization_failed':
//             const invoiceFinalizationFailed = event.data.object;
//             console.log("invoiceFinalizationFailed", JSON.stringify(invoiceFinalizationFailed))
//             // Then define and call a function to handle the event invoice.finalization_failed
//             break;
//         case 'invoice.finalized':
//             const invoiceFinalized = event.data.object;
//             console.log("invoiceFinalized", JSON.stringify(invoiceFinalized))
//             // Then define and call a function to handle the event invoice.finalized
//             break;
//         case 'invoice.marked_uncollectible':
//             const invoiceMarkedUncollectible = event.data.object;
//             console.log("invoiceMarkedUncollectible", JSON.stringify(invoiceMarkedUncollectible))
//             // Then define and call a function to handle the event invoice.marked_uncollectible
//             break;
//         case 'invoice.paid':
//             const invoicePaid = event.data.object;
//             console.log("invoicePaid", JSON.stringify(invoicePaid))
//             // Then define and call a function to handle the event invoice.paid
//             break;
//         case 'invoice.payment_action_required':
//             const invoicePaymentActionRequired = event.data.object;
//             console.log("invoicePaymentActionRequired", JSON.stringify(invoicePaymentActionRequired))
//             // Then define and call a function to handle the event invoice.payment_action_required
//             break;
//         case 'invoice.payment_failed':
//             const invoicePaymentFailed = event.data.object;
//             console.log("invoicePaymentFailed", JSON.stringify(invoicePaymentFailed))
//             // Then define and call a function to handle the event invoice.payment_failed
//             break;
//         case 'invoice.payment_succeeded':
//             const invoicePaymentSucceeded = event.data.object;
//             console.log("invoicePaymentSucceeded", JSON.stringify(invoicePaymentSucceeded))
//             // Then define and call a function to handle the event invoice.payment_succeeded
//             break;
//         case 'invoice.sent':
//             const invoiceSent = event.data.object;
//             console.log("invoiceSent", JSON.stringify(invoiceSent))
//             // Then define and call a function to handle the event invoice.sent
//             break;
//         case 'invoice.upcoming':
//             const invoiceUpcoming = event.data.object;
//             console.log("invoiceUpcoming", JSON.stringify(invoiceUpcoming))
//             // Then define and call a function to handle the event invoice.upcoming
//             break;
//         case 'invoice.updated':
//             const invoiceUpdated = event.data.object;
//             console.log("invoiceUpdated", JSON.stringify(invoiceUpdated))
//             // Then define and call a function to handle the event invoice.updated
//             break;
//         case 'invoice.voided':
//             const invoiceVoided = event.data.object;
//             console.log("invoiceVoided", JSON.stringify(invoiceVoided))
//             // Then define and call a function to handle the event invoice.voided
//             break;
//         case 'invoiceitem.created':
//             const invoiceitemCreated = event.data.object;
//             console.log("invoiceitemCreated", JSON.stringify(invoiceitemCreated))
//             // Then define and call a function to handle the event invoiceitem.created
//             break;
//         case 'invoiceitem.deleted':
//             const invoiceitemDeleted = event.data.object;
//             console.log("invoiceitemDeleted", JSON.stringify(invoiceitemDeleted))
//             // Then define and call a function to handle the event invoiceitem.deleted
//             break;
//         case 'issuing_authorization.created':
//             const issuingAuthorizationCreated = event.data.object;
//             console.log("issuingAuthorizationCreated", JSON.stringify(issuingAuthorizationCreated))
//             // Then define and call a function to handle the event issuing_authorization.created
//             break;
//         case 'issuing_authorization.request':
//             const issuingAuthorizationRequest = event.data.object;
//             console.log("issuingAuthorizationRequest", JSON.stringify(issuingAuthorizationRequest))
//             // Then define and call a function to handle the event issuing_authorization.request
//             break;
//         case 'issuing_authorization.updated':
//             const issuingAuthorizationUpdated = event.data.object;
//             console.log("issuingAuthorizationUpdated", JSON.stringify(issuingAuthorizationUpdated))
//             // Then define and call a function to handle the event issuing_authorization.updated
//             break;
//         case 'issuing_card.created':
//             const issuingCardCreated = event.data.object;
//             console.log("issuingCardCreated", JSON.stringify(issuingCardCreated))
//             // Then define and call a function to handle the event issuing_card.created
//             break;
//         case 'issuing_card.updated':
//             const issuingCardUpdated = event.data.object;
//             console.log("issuingCardUpdated", JSON.stringify(issuingCardUpdated))
//             // Then define and call a function to handle the event issuing_card.updated
//             break;
//         case 'issuing_cardholder.created':
//             const issuingCardholderCreated = event.data.object;
//             console.log("issuingCardholderCreated", JSON.stringify(issuingCardholderCreated))
//             // Then define and call a function to handle the event issuing_cardholder.created
//             break;
//         case 'issuing_cardholder.updated':
//             const issuingCardholderUpdated = event.data.object;
//             console.log("issuingCardholderUpdated", JSON.stringify(issuingCardholderUpdated))
//             // Then define and call a function to handle the event issuing_cardholder.updated
//             break;
//         case 'issuing_dispute.closed':
//             const issuingDisputeClosed = event.data.object;
//             console.log("issuingDisputeClosed", JSON.stringify(issuingDisputeClosed))
//             // Then define and call a function to handle the event issuing_dispute.closed
//             break;
//         case 'issuing_dispute.created':
//             const issuingDisputeCreated = event.data.object;
//             console.log("issuingDisputeCreated", JSON.stringify(issuingDisputeCreated))
//             // Then define and call a function to handle the event issuing_dispute.created
//             break;
//         case 'issuing_dispute.funds_reinstated':
//             const issuingDisputeFundsReinstated = event.data.object;
//             console.log("issuingDisputeFundsReinstated", JSON.stringify(issuingDisputeFundsReinstated))
//             // Then define and call a function to handle the event issuing_dispute.funds_reinstated
//             break;
//         case 'issuing_dispute.submitted':
//             const issuingDisputeSubmitted = event.data.object;
//             console.log("issuingDisputeSubmitted", JSON.stringify(issuingDisputeSubmitted))
//             // Then define and call a function to handle the event issuing_dispute.submitted
//             break;
//         case 'issuing_dispute.updated':
//             const issuingDisputeUpdated = event.data.object;
//             console.log("issuingDisputeUpdated", JSON.stringify(issuingDisputeUpdated))
//             // Then define and call a function to handle the event issuing_dispute.updated
//             break;
//         case 'issuing_token.created':
//             const issuingTokenCreated = event.data.object;
//             console.log("issuingTokenCreated", JSON.stringify(issuingTokenCreated))
//             // Then define and call a function to handle the event issuing_token.created
//             break;
//         case 'issuing_token.updated':
//             const issuingTokenUpdated = event.data.object;
//             console.log("issuingTokenUpdated", JSON.stringify(issuingTokenUpdated))
//             // Then define and call a function to handle the event issuing_token.updated
//             break;
//         case 'issuing_transaction.created':
//             const issuingTransactionCreated = event.data.object;
//             console.log("issuingTransactionCreated", JSON.stringify(issuingTransactionCreated))
//             // Then define and call a function to handle the event issuing_transaction.created
//             break;
//         case 'issuing_transaction.updated':
//             const issuingTransactionUpdated = event.data.object;
//             console.log("issuingTransactionUpdated", JSON.stringify(issuingTransactionUpdated))
//             // Then define and call a function to handle the event issuing_transaction.updated
//             break;
//         case 'mandate.updated':
//             const mandateUpdated = event.data.object;
//             console.log("mandateUpdated", JSON.stringify(mandateUpdated))
//             // Then define and call a function to handle the event mandate.updated
//             break;
//         case 'payment_intent.amount_capturable_updated':
//             const paymentIntentAmountCapturableUpdated = event.data.object;
//             console.log("paymentIntentAmountCapturableUpdated", JSON.stringify(paymentIntentAmountCapturableUpdated))
//             // Then define and call a function to handle the event payment_intent.amount_capturable_updated
//             break;
//         case 'payment_intent.canceled':
//             const paymentIntentCanceled = event.data.object;
//             console.log("paymentIntentCanceled", JSON.stringify(paymentIntentCanceled))
//             // Then define and call a function to handle the event payment_intent.canceled
//             break;
//         case 'payment_intent.created':
//             const paymentIntentCreated = event.data.object;
//             console.log("paymentIntentCreated", JSON.stringify(paymentIntentCreated))
//             // Then define and call a function to handle the event payment_intent.created
//             break;
//         case 'payment_intent.partially_funded':
//             const paymentIntentPartiallyFunded = event.data.object;
//             console.log("paymentIntentPartiallyFunded", JSON.stringify(paymentIntentPartiallyFunded))
//             // Then define and call a function to handle the event payment_intent.partially_funded
//             break;
//         case 'payment_intent.payment_failed':
//             const paymentIntentPaymentFailed = event.data.object;
//             console.log("paymentIntentPaymentFailed", JSON.stringify(paymentIntentPaymentFailed))
//             // Then define and call a function to handle the event payment_intent.payment_failed
//             break;
//         case 'payment_intent.processing':
//             const paymentIntentProcessing = event.data.object;
//             console.log("paymentIntentProcessing", JSON.stringify(paymentIntentProcessing))
//             // Then define and call a function to handle the event payment_intent.processing
//             break;
//         case 'payment_intent.requires_action':
//             const paymentIntentRequiresAction = event.data.object;
//             console.log("paymentIntentRequiresAction", JSON.stringify(paymentIntentRequiresAction))
//             // Then define and call a function to handle the event payment_intent.requires_action
//             break;
//         case 'payment_intent.succeeded':
//             const paymentIntentSucceeded = event.data.object;
//             console.log("paymentIntentSucceeded", JSON.stringify(paymentIntentSucceeded))
//             // Then define and call a function to handle the event payment_intent.succeeded
//             break;
//         case 'payment_link.created':
//             const paymentLinkCreated = event.data.object;
//             console.log("paymentLinkCreated", JSON.stringify(paymentLinkCreated))
//             // Then define and call a function to handle the event payment_link.created
//             break;
//         case 'payment_link.updated':
//             const paymentLinkUpdated = event.data.object;
//             console.log("paymentLinkUpdated", JSON.stringify(paymentLinkUpdated))
//             // Then define and call a function to handle the event payment_link.updated
//             break;
//         case 'payment_method.attached':
//             const paymentMethodAttached = event.data.object;
//             console.log("paymentMethodAttached", JSON.stringify(paymentMethodAttached))
//             // Then define and call a function to handle the event payment_method.attached
//             break;
//         case 'payment_method.automatically_updated':
//             const paymentMethodAutomaticallyUpdated = event.data.object;
//             console.log("paymentMethodAutomaticallyUpdated", JSON.stringify(paymentMethodAutomaticallyUpdated))
//             // Then define and call a function to handle the event payment_method.automatically_updated
//             break;
//         case 'payment_method.detached':
//             const paymentMethodDetached = event.data.object;
//             console.log("paymentMethodDetached", JSON.stringify(paymentMethodDetached))
//             // Then define and call a function to handle the event payment_method.detached
//             break;
//         case 'payment_method.updated':
//             const paymentMethodUpdated = event.data.object;
//             console.log("paymentMethodUpdated", JSON.stringify(paymentMethodUpdated))
//             // Then define and call a function to handle the event payment_method.updated
//             break;
//         case 'payout.canceled':
//             const payoutCanceled = event.data.object;
//             console.log("payoutCanceled", JSON.stringify(payoutCanceled))
//             // Then define and call a function to handle the event payout.canceled
//             break;
//         case 'payout.created':
//             const payoutCreated = event.data.object;
//             console.log("payoutCreated", JSON.stringify(payoutCreated))
//             // Then define and call a function to handle the event payout.created
//             break;
//         case 'payout.failed':
//             const payoutFailed = event.data.object;
//             console.log("payoutFailed", JSON.stringify(payoutFailed))
//             // Then define and call a function to handle the event payout.failed
//             break;
//         case 'payout.paid':
//             const payoutPaid = event.data.object;
//             console.log("payoutPaid", JSON.stringify(payoutPaid))
//             // Then define and call a function to handle the event payout.paid
//             break;
//         case 'payout.reconciliation_completed':
//             const payoutReconciliationCompleted = event.data.object;
//             console.log("payoutReconciliationCompleted", JSON.stringify(payoutReconciliationCompleted))
//             // Then define and call a function to handle the event payout.reconciliation_completed
//             break;
//         case 'payout.updated':
//             const payoutUpdated = event.data.object;
//             console.log("payoutUpdated", JSON.stringify(payoutUpdated))
//             // Then define and call a function to handle the event payout.updated
//             break;
//         case 'person.created':
//             const personCreated = event.data.object;
//             console.log("personCreated", JSON.stringify(personCreated))
//             // Then define and call a function to handle the event person.created
//             break;
//         case 'person.deleted':
//             const personDeleted = event.data.object;
//             console.log("personDeleted", JSON.stringify(personDeleted))
//             // Then define and call a function to handle the event person.deleted
//             break;
//         case 'person.updated':
//             const personUpdated = event.data.object;
//             console.log("personUpdated", JSON.stringify(personUpdated))
//             // Then define and call a function to handle the event person.updated
//             break;
//         case 'plan.created':
//             const planCreated = event.data.object;
//             console.log("planCreated", JSON.stringify(planCreated))
//             // Then define and call a function to handle the event plan.created
//             break;
//         case 'plan.deleted':
//             const planDeleted = event.data.object;
//             console.log("planDeleted", JSON.stringify(planDeleted))
//             // Then define and call a function to handle the event plan.deleted
//             break;
//         case 'plan.updated':
//             const planUpdated = event.data.object;
//             console.log("planUpdated", JSON.stringify(planUpdated))
//             // Then define and call a function to handle the event plan.updated
//             break;
//         case 'price.created':
//             const priceCreated = event.data.object;
//             console.log("priceCreated", JSON.stringify(priceCreated))
//             // Then define and call a function to handle the event price.created
//             break;
//         case 'price.deleted':
//             const priceDeleted = event.data.object;
//             console.log("priceDeleted", JSON.stringify(priceDeleted))
//             // Then define and call a function to handle the event price.deleted
//             break;
//         case 'price.updated':
//             const priceUpdated = event.data.object;
//             console.log("priceUpdated", JSON.stringify(priceUpdated))
//             // Then define and call a function to handle the event price.updated
//             break;
//         case 'product.created':
//             const productCreated = event.data.object;
//             console.log("productCreated", JSON.stringify(productCreated))
//             // Then define and call a function to handle the event product.created
//             break;
//         case 'product.deleted':
//             const productDeleted = event.data.object;
//             console.log("productDeleted", JSON.stringify(productDeleted))
//             // Then define and call a function to handle the event product.deleted
//             break;
//         case 'product.updated':
//             const productUpdated = event.data.object;
//             console.log("productUpdated", JSON.stringify(productUpdated))
//             // Then define and call a function to handle the event product.updated
//             break;
//         case 'promotion_code.created':
//             const promotionCodeCreated = event.data.object;
//             console.log("promotionCodeCreated", JSON.stringify(promotionCodeCreated))
//             // Then define and call a function to handle the event promotion_code.created
//             break;
//         case 'promotion_code.updated':
//             const promotionCodeUpdated = event.data.object;
//             console.log("promotionCodeUpdated", JSON.stringify(promotionCodeUpdated))
//             // Then define and call a function to handle the event promotion_code.updated
//             break;
//         case 'quote.accepted':
//             const quoteAccepted = event.data.object;
//             console.log("quoteAccepted", JSON.stringify(quoteAccepted))
//             // Then define and call a function to handle the event quote.accepted
//             break;
//         case 'quote.canceled':
//             const quoteCanceled = event.data.object;
//             console.log("quoteCanceled", JSON.stringify(quoteCanceled))
//             // Then define and call a function to handle the event quote.canceled
//             break;
//         case 'quote.created':
//             const quoteCreated = event.data.object;
//             console.log("quoteCreated", JSON.stringify(quoteCreated))
//             // Then define and call a function to handle the event quote.created
//             break;
//         case 'quote.finalized':
//             const quoteFinalized = event.data.object;
//             console.log("quoteFinalized", JSON.stringify(quoteFinalized))
//             // Then define and call a function to handle the event quote.finalized
//             break;
//         case 'radar.early_fraud_warning.created':
//             const radarEarlyFraudWarningCreated = event.data.object;
//             console.log("radarEarlyFraudWarningCreated", JSON.stringify(radarEarlyFraudWarningCreated))
//             // Then define and call a function to handle the event radar.early_fraud_warning.created
//             break;
//         case 'radar.early_fraud_warning.updated':
//             const radarEarlyFraudWarningUpdated = event.data.object;
//             console.log("radarEarlyFraudWarningUpdated", JSON.stringify(radarEarlyFraudWarningUpdated))
//             // Then define and call a function to handle the event radar.early_fraud_warning.updated
//             break;
//         case 'refund.created':
//             const refundCreated = event.data.object;
//             console.log("refundCreated", JSON.stringify(refundCreated))
//             // Then define and call a function to handle the event refund.created
//             break;
//         case 'refund.updated':
//             const refundUpdated = event.data.object;
//             console.log("refundUpdated", JSON.stringify(refundUpdated))
//             // Then define and call a function to handle the event refund.updated
//             break;
//         case 'reporting.report_run.failed':
//             const reportingReportRunFailed = event.data.object;
//             console.log("reportingReportRunFailed", JSON.stringify(reportingReportRunFailed))
//             // Then define and call a function to handle the event reporting.report_run.failed
//             break;
//         case 'reporting.report_run.succeeded':
//             const reportingReportRunSucceeded = event.data.object;
//             console.log("reportingReportRunSucceeded", JSON.stringify(reportingReportRunSucceeded))
//             // Then define and call a function to handle the event reporting.report_run.succeeded
//             break;
//         case 'reporting.report_type.updated':
//             const reportingReportTypeUpdated = event.data.object;
//             console.log("reportingReportTypeUpdated", JSON.stringify(reportingReportTypeUpdated))
//             // Then define and call a function to handle the event reporting.report_type.updated
//             break;
//         case 'review.closed':
//             const reviewClosed = event.data.object;
//             console.log("reviewClosed", JSON.stringify(reviewClosed))
//             // Then define and call a function to handle the event review.closed
//             break;
//         case 'review.opened':
//             const reviewOpened = event.data.object;
//             console.log("reviewOpened", JSON.stringify(reviewOpened))
//             // Then define and call a function to handle the event review.opened
//             break;
//         case 'setup_intent.canceled':
//             const setupIntentCanceled = event.data.object;
//             console.log("setupIntentCanceled", JSON.stringify(setupIntentCanceled))
//             // Then define and call a function to handle the event setup_intent.canceled
//             break;
//         case 'setup_intent.created':
//             const setupIntentCreated = event.data.object;
//             console.log("setupIntentCreated", JSON.stringify(setupIntentCreated))
//             // Then define and call a function to handle the event setup_intent.created
//             break;
//         case 'setup_intent.requires_action':
//             const setupIntentRequiresAction = event.data.object;
//             console.log("setupIntentRequiresAction", JSON.stringify(setupIntentRequiresAction))
//             // Then define and call a function to handle the event setup_intent.requires_action
//             break;
//         case 'setup_intent.setup_failed':
//             const setupIntentSetupFailed = event.data.object;
//             console.log("setupIntentSetupFailed", JSON.stringify(setupIntentSetupFailed))
//             // Then define and call a function to handle the event setup_intent.setup_failed
//             break;
//         case 'setup_intent.succeeded':
//             const setupIntentSucceeded = event.data.object;
//             console.log("setupIntentSucceeded", JSON.stringify(setupIntentSucceeded))
//             // Then define and call a function to handle the event setup_intent.succeeded
//             break;
//         case 'sigma.scheduled_query_run.created':
//             const sigmaScheduledQueryRunCreated = event.data.object;
//             console.log("sigmaScheduledQueryRunCreated", JSON.stringify(sigmaScheduledQueryRunCreated))
//             // Then define and call a function to handle the event sigma.scheduled_query_run.created
//             break;
//         case 'source.canceled':
//             const sourceCanceled = event.data.object;
//             console.log("sourceCanceled", JSON.stringify(sourceCanceled))
//             // Then define and call a function to handle the event source.canceled
//             break;
//         case 'source.chargeable':
//             const sourceChargeable = event.data.object;
//             console.log("sourceChargeable", JSON.stringify(sourceChargeable))
//             // Then define and call a function to handle the event source.chargeable
//             break;
//         case 'source.failed':
//             const sourceFailed = event.data.object;
//             console.log("sourceFailed", JSON.stringify(sourceFailed))
//             // Then define and call a function to handle the event source.failed
//             break;
//         case 'source.mandate_notification':
//             const sourceMandateNotification = event.data.object;
//             console.log("sourceMandateNotification", JSON.stringify(sourceMandateNotification))
//             // Then define and call a function to handle the event source.mandate_notification
//             break;
//         case 'source.refund_attributes_required':
//             const sourceRefundAttributesRequired = event.data.object;
//             console.log("sourceRefundAttributesRequired", JSON.stringify(sourceRefundAttributesRequired))
//             // Then define and call a function to handle the event source.refund_attributes_required
//             break;
//         case 'source.transaction.created':
//             const sourceTransactionCreated = event.data.object;
//             console.log("sourceTransactionCreated", JSON.stringify(sourceTransactionCreated))
//             // Then define and call a function to handle the event source.transaction.created
//             break;
//         case 'source.transaction.updated':
//             const sourceTransactionUpdated = event.data.object;
//             console.log("sourceTransactionUpdated", JSON.stringify(sourceTransactionUpdated))
//             // Then define and call a function to handle the event source.transaction.updated
//             break;
//         case 'subscription_schedule.aborted':
//             const subscriptionScheduleAborted = event.data.object;
//             console.log("subscriptionScheduleAborted", JSON.stringify(subscriptionScheduleAborted))
//             // Then define and call a function to handle the event subscription_schedule.aborted
//             break;
//         case 'subscription_schedule.canceled':
//             const subscriptionScheduleCanceled = event.data.object;
//             console.log("subscriptionScheduleCanceled", JSON.stringify(subscriptionScheduleCanceled))
//             // Then define and call a function to handle the event subscription_schedule.canceled
//             break;
//         case 'subscription_schedule.completed':
//             const subscriptionScheduleCompleted = event.data.object;
//             console.log("subscriptionScheduleCompleted", JSON.stringify(subscriptionScheduleCompleted))
//             // Then define and call a function to handle the event subscription_schedule.completed
//             break;
//         case 'subscription_schedule.created':
//             const subscriptionScheduleCreated = event.data.object;
//             console.log("subscriptionScheduleCreated", JSON.stringify(subscriptionScheduleCreated))
//             // Then define and call a function to handle the event subscription_schedule.created
//             break;
//         case 'subscription_schedule.expiring':
//             const subscriptionScheduleExpiring = event.data.object;
//             console.log("subscriptionScheduleExpiring", JSON.stringify(subscriptionScheduleExpiring))
//             // Then define and call a function to handle the event subscription_schedule.expiring
//             break;
//         case 'subscription_schedule.released':
//             const subscriptionScheduleReleased = event.data.object;
//             console.log("subscriptionScheduleReleased", JSON.stringify(subscriptionScheduleReleased))
//             // Then define and call a function to handle the event subscription_schedule.released
//             break;
//         case 'subscription_schedule.updated':
//             const subscriptionScheduleUpdated = event.data.object;
//             console.log("subscriptionScheduleUpdated", JSON.stringify(subscriptionScheduleUpdated))
//             // Then define and call a function to handle the event subscription_schedule.updated
//             break;
//         case 'tax.settings.updated':
//             const taxSettingsUpdated = event.data.object;
//             console.log("taxSettingsUpdated", JSON.stringify(taxSettingsUpdated))
//             // Then define and call a function to handle the event tax.settings.updated
//             break;
//         case 'tax_rate.created':
//             const taxRateCreated = event.data.object;
//             console.log("taxRateCreated", JSON.stringify(taxRateCreated))
//             // Then define and call a function to handle the event tax_rate.created
//             break;
//         case 'tax_rate.updated':
//             const taxRateUpdated = event.data.object;
//             console.log("taxRateUpdated", JSON.stringify(taxRateUpdated))
//             // Then define and call a function to handle the event tax_rate.updated
//             break;
//         case 'terminal.reader.action_failed':
//             const terminalReaderActionFailed = event.data.object;
//             console.log("terminalReaderActionFailed", JSON.stringify(terminalReaderActionFailed))
//             // Then define and call a function to handle the event terminal.reader.action_failed
//             break;
//         case 'terminal.reader.action_succeeded':
//             const terminalReaderActionSucceeded = event.data.object;
//             console.log("terminalReaderActionSucceeded", JSON.stringify(terminalReaderActionSucceeded))
//             // Then define and call a function to handle the event terminal.reader.action_succeeded
//             break;
//         case 'test_helpers.test_clock.advancing':
//             const testHelpersTestClockAdvancing = event.data.object;
//             console.log("testHelpersTestClockAdvancing", JSON.stringify(testHelpersTestClockAdvancing))
//             // Then define and call a function to handle the event test_helpers.test_clock.advancing
//             break;
//         case 'test_helpers.test_clock.created':
//             const testHelpersTestClockCreated = event.data.object;
//             console.log("testHelpersTestClockCreated", JSON.stringify(testHelpersTestClockCreated))
//             // Then define and call a function to handle the event test_helpers.test_clock.created
//             break;
//         case 'test_helpers.test_clock.deleted':
//             const testHelpersTestClockDeleted = event.data.object;
//             console.log("testHelpersTestClockDeleted", JSON.stringify(testHelpersTestClockDeleted))
//             // Then define and call a function to handle the event test_helpers.test_clock.deleted
//             break;
//         case 'test_helpers.test_clock.internal_failure':
//             const testHelpersTestClockInternalFailure = event.data.object;
//             console.log("testHelpersTestClockInternalFailure", JSON.stringify(testHelpersTestClockInternalFailure))
//             // Then define and call a function to handle the event test_helpers.test_clock.internal_failure
//             break;
//         case 'test_helpers.test_clock.ready':
//             const testHelpersTestClockReady = event.data.object;
//             console.log("testHelpersTestClockReady", JSON.stringify(testHelpersTestClockReady))
//             // Then define and call a function to handle the event test_helpers.test_clock.ready
//             break;
//         case 'topup.canceled':
//             const topupCanceled = event.data.object;
//             console.log("topupCanceled", JSON.stringify(topupCanceled))
//             // Then define and call a function to handle the event topup.canceled
//             break;
//         case 'topup.created':
//             const topupCreated = event.data.object;
//             console.log("topupCreated", JSON.stringify(topupCreated))
//             // Then define and call a function to handle the event topup.created
//             break;
//         case 'topup.failed':
//             const topupFailed = event.data.object;
//             console.log("topupFailed", JSON.stringify(topupFailed))
//             // Then define and call a function to handle the event topup.failed
//             break;
//         case 'topup.reversed':
//             const topupReversed = event.data.object;
//             console.log("topupReversed", JSON.stringify(topupReversed))
//             // Then define and call a function to handle the event topup.reversed
//             break;
//         case 'topup.succeeded':
//             const topupSucceeded = event.data.object;
//             console.log("topupSucceeded", JSON.stringify(topupSucceeded))
//             // Then define and call a function to handle the event topup.succeeded
//             break;
//         case 'transfer.created':
//             const transferCreated = event.data.object;
//             console.log("transferCreated", JSON.stringify(transferCreated))
//             // Then define and call a function to handle the event transfer.created
//             break;
//         case 'transfer.reversed':
//             const transferReversed = event.data.object;
//             console.log("transferReversed", JSON.stringify(transferReversed))
//             // Then define and call a function to handle the event transfer.reversed
//             break;
//         case 'transfer.updated':
//             const transferUpdated = event.data.object;
//             console.log("transferUpdated", JSON.stringify(transferUpdated))
//             // Then define and call a function to handle the event transfer.updated
//             break;
//         // ... handle other event types
//         default:
//             console.log(`Unhandled event type ${event.type}`);
//     }

//     // Return a 200 response to acknowledge receipt of the event
//     response.send();
// });

// app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
//     console.log("test webhook")
//     let event;

//     try {
//         const signature = req.headers['stripe-signature'];
//         event = stripe.webhooks.constructEvent(
//             req.body,
//             signature,
//             process.env.STRIPE_WEBHOOK_SECRET // Set your webhook secret here
//         );
//     } catch (err) {
//         console.error(`Webhook Error: ${err.message}`);
//         return res.status(400).send(`Webhook Error: ${err.message}`);
//     }

//     // Handle the checkout.session.completed event
//     if (event.type === 'checkout.session.completed') {
//         const session = event.data.object;

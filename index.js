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
const validator = require('validator');



const saltRounds = 10;


const app = express();

const port = process.env.PORT || 3000;




const PEPPER = 'yourRandomStringHere'; // Replace with your actual pepper

const bucketName = process.env.MINIO_BUCKET_NAME;


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



// TODO: Subscription authentication for the dashboard.

app.post('/webhook', express.raw({ type: 'application/json' }),
    (request, response) => {
        const sig = request.headers['stripe-signature'];




        // Parse the JSON from the request body
        const requestBody = JSON.parse(request.body.toString());

        // Extract the userId from metadata before checking the event
        const userId = requestBody.data.object.metadata.userId;
        console.log("User ID:", userId);



        let idarr = userId.split(",");
        console.log("userID", idarr[0]);
        console.log("ProductID", idarr[1]);

        let ProcessedUserID = idarr[0];
        let ProcessedProductID = idarr[1];
        const updateQuery = `
            UPDATE subscriptionHistory 
            SET status = 'active', stripe_subscription_id = ?
            WHERE user_id = ? AND status = 'pending'
        `;

        db.query(updateQuery, [ProcessedProductID, ProcessedUserID], (err, results) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).send('Error 9000');
            }
            // if (results.length === 0) {
            //     return res.status(404).send('User not found');
            // }
        });


        console.log("request from payment", request.body.toString());
        // Extract the userId from metadata before checking the event

        // const userId = request.body.data.object.metadata.userId;
        // console.log("User ID:", userId);



        let event;


        test = request.body.toString()

        // Check if the event type is 'checkout.session.completed'
        if (event.type === 'checkout.session.completed') {
        // const checkoutSession = event.data.object;

            // Extract the userId
            const checkoutSession = event.data.object;
            const userId = checkoutSession.metadata.userId;
            console.log("User ID:", userId);




            console.log("Checkout session completed for User ID:", userId);
            console.log("Stripe Subscription ID:", stripeSubscriptionId);



            // Handle the checkout session completed event
            // Here you can add code to update the user's status in your database
            // using the extracted userId
        }



        try {
            // JSON to access the Stripe event data
            const eventJson = JSON.stringify(request.body);

            event = stripe.webhooks.constructEvent(eventJson, sig, endpointSecret);

            console.log("event", event)
            console.log("event.type", event.type)


        } catch (err) {
            response.status(400).send(`Webhook Error: ${err.message}`);
            return;
        }

        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed':
                const checkoutSessionCompleted = event.data.object;
                console.log(checkoutSessionCompleted)

                // Then define and call a function to handle the event checkout.session.completed
                break;
            // ... handle other event types
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        console.log('finshed')

        // Return a 200 response to acknowledge receipt of the event
        // response.status(200).send(`Webhook Error: ${err.message}`);
        response.status(200)
        response.send();
    });






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
        concat = userId.toString() + "," + product.id.toString(), ",", product.priceID.toString();
        // Create Stripe checkout session
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

        res.json({ url: session.url });
    } catch (error) {
        console.error(`Error processing subscription for user ID ${userId}:`, error);
        res.status(500).send({ error: error.message });
    }
});


app.get('/api/search', (req, res) => {

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


console.log("session", JSON.stringify(session))

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



//api Index page
app.get('/api/search/basic', (req, res) => {
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


app.get('/api/search/user', (req, res) => {
    const userId = req.query.userId;
    const searchQuery = 'SELECT * FROM generatedImages WHERE user_id = ?';
    db.query(searchQuery, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json({ items: results });
    });
});

app.get('/api/search/negativePrompt', (req, res) => {
    const negativePrompt = req.query.negativePrompt;
    const searchQuery = 'SELECT * FROM generatedImages WHERE negative_prompt LIKE ?';
    db.query(searchQuery, [`%${negativePrompt}%`], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json({ items: results });
    });
});

app.get('/api/search/style', (req, res) => {
    const style = req.query.style;
    const searchQuery = 'SELECT * FROM generatedImages WHERE style = ?';
    db.query(searchQuery, [style], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json({ items: results });
    });
});

app.get('/api/search/alphabetical', (req, res) => {
    const searchQuery = 'SELECT * FROM generatedImages ORDER BY header ASC';
    db.query(searchQuery, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json({ items: results });
    });
});

app.get('/api/search/advanced', (req, res) => {
    let { searchTerm, userId, style, negativePrompt } = req.query;
    searchTerm = searchTerm || '';
    let filters = [];
    let queryParams = [];
    let baseQuery = 'SELECT * FROM generatedImages';

    if (userId) {
        filters.push(' user_id = ? ');
        queryParams.push(userId);
    }
    if (style) {
        filters.push(' style = ? ');
        queryParams.push(style);
    }
    if (negativePrompt) {
        filters.push(' negative_prompt LIKE ? ');
        queryParams.push(`%${negativePrompt}%`);
    }
    if (filters.length > 0) {
        baseQuery += ' WHERE ';
        baseQuery += filters.join(' AND ');
    }
    baseQuery += ' ORDER BY header ASC';

    db.query(baseQuery, queryParams, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json({ items: results });
    });
});

app.post('/api/delete-account', (req, res) => {
    const userId = req.body.userId;

    // Check if userId is provided
    if (!userId) {
        return res.status(400).send({ message: 'User ID is required' });
    }

    // First, retrieve the current username
    db.query('SELECT username FROM users WHERE user_id = ?', [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send({ message: 'Internal server error' });
        }
        if (results.length === 0) {
            return res.status(404).send({ message: 'User not found' });
        }

        // Append "deleted_user" to the current username
        const newUsername = results[0].username + '_deleted_user';

        // Update the username in the database
        const updateQuery = 'UPDATE users SET username = ? WHERE user_id = ?';
        db.query(updateQuery, [newUsername, userId], (updateErr, updateResult) => {
            if (updateErr) {
                console.error(updateErr);
                return res.status(500).send({ message: 'Error updating username' });
            }
            if (updateResult.affectedRows === 0) {
                return res.status(404).send({ message: 'User not found' });
            }
            res.send({ message: 'Account successfully updated' });
        });
    });
});

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
        let sqlquery = "INSERT INTO users (username, email, password, role_id, profile_picture) VALUES (?,?,?,?,?)";

        let DefaultProfilePicture = "ecstasyessentials.shop/images/Pfp.jpeg";

        db.query(sqlquery, [username, email, hashedPassword, defaultRoleId, DefaultProfilePicture], (err) => {
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


// This is going to be the dashboard

// const bucketName = 'aidashboardbucket';
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


app.get('/gallery', (req, res) => {
    const bucketName = 'aidashboardbucket';
    const objects = [];

    minioClient.listObjectsV2(bucketName, '', true, "1000")
        .on("error", error => {
            console.error(error);
            res.status(500).send("Error fetching images");
        })
        .on('data', data => {
            objects.push({
                name: data.name,
                url: `/images/${data.name}` // Assuming this is the correct URL format
            });
        })
        .on('end', () => {
            // Render the 'gallery.ejs' template and pass the image objects
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


const upload = multer({ dest: 'uploads/' });



const { Readable } = require('stream'); // Import Readable from the 'stream' module
// if (!req.session.userId) {
//     return res.status(403).send('User not authenticated');


// app.get('/dashboard', (req, res) => {
//     // res.render('dashboard.ejs');
//     res.render('dashboard', { user: req.session.user });
// });

app.get('/dashboard', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    res.render('dashboard', { userId: req.session.userId });
});



app.post('/dashboard', async (req, res) => {

    const { prompt, negative_prompt, steps, seed, width, height, cfg_scale, userId } = req.body;
    console.log("Received userId:", prompt);
    console.log("Received userId:", negative_prompt);
    console.log("Received userId:", steps);
    console.log("Received userId:", seed);
    console.log("Received userId:", width);
    console.log("Received userId:", cfg_scale);
    console.log("Received userId:", userId);


    try {
        const response = await axios.post('https://a291-147-12-195-79.ngrok-free.app/generateImage', {
            prompt, negative_prompt, steps, seed, width, height, cfg_scale
        });

        // Extract image base64 data and convert to Buffer
        const imageHex = response.data.imageHex;
        const imageBuffer = Buffer.from(imageHex, 'base64');

        // Create a Readable stream from the Buffer
        const readableStream = new Readable();
        readableStream.push(imageBuffer);
        readableStream.push(null);

        // Define file name
        const fileName = `image_${Date.now()}.jpeg`;

        // Upload the stream to MinIO
        const bucketName = 'aidashboardbucket';
        // minioClient.putObject(bucketName, fileName, readableStream, imageBuffer.length, async (err, etag) => {
        //     if (err) {
        //         console.error(`Error uploading to MinIO: ${err}`);
        //         return res.status(500).send(err.message);
        //     }

        //     // Image uploaded to MinIO, now send the same image data back to the frontend
        //     res.json({ imageHex });
        // });

        minioClient.putObject(bucketName, fileName, readableStream, imageBuffer.length, async (err, etag) => {
            if (err) {
                console.error(`Error uploading to MinIO: ${err}`);
                return res.status(500).send(err.message);
            }

            // Construct the URL for the image
            const imageUrl = `https://ecstasyessentials.shop/images/${fileName}`;
            // const imageUrl = `https://${bucketName}/${fileName}`;

            // https://ecstasyessentials.shop/images/imageMinio5.png

            // Store the image URL and related data in the userGallery table
            const insertQuery = "INSERT INTO userGallery (user_id, prompt, negative_prompt, steps, seed, width, height, cfg_scale, image_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";
            db.query(insertQuery, [userId, prompt, negative_prompt, steps, seed, width, height, cfg_scale, imageUrl], (err, results) => {
                if (err) {
                    console.error(`Error saving image data to database: ${err}`);
                    return res.status(500).send('Error saving image data');
                }
                console.log("Image data saved to database");

                // Image uploaded to MinIO and data stored in DB, now send the image data back to the frontend
                res.json({ imageHex });
            });
        });
    } catch (error) {
        console.error(`Error: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});


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


app.get('/DevelopersAPI', (req, res) => {
    res.render('DevelopersAPI');
});

app.post('/DevelopersAPI', (req, res) => {
    res.send('POST request to /DevelopersAPI');
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


const express = require('express');
const ejs = require('ejs');
const path = require('path');
const mysql = require('mysql');
require('dotenv').config();


const port = process.env.PORT || 3000;


// MySQL database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

db.connect((err) => {
    if (err) { throw err; }
    console.log('Connected to the MySQL Server');
});


const app = express();

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


app.get('/', (req, res) => {
    res.render('index.ejs');
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



app.get('/addbook', (req, res) => {
    res.render('addbook.ejs');
});

app.post('/addbook', (req, res) => {
    res.send('POST request to addbook');
});

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

app.get('/dashboard', (req, res) => {
    res.render('dashboard.ejs');
});

app.post('/dashboard', (req, res) => {
    res.send('POST request to user/dashboard');
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

app.get('/userProfile', (req, res) => {
    res.render('userProfile.ejs');
});

app.post('/userProfile', (req, res) => {
    res.send('POST request to user/userProfile');
});

app.get('/login', (req, res) => {
    res.render('login.ejs');
});

app.post('/login', (req, res) => {
    res.send('POST request to public/auth/login');
});

app.get('/register', (req, res) => {
    res.render('register.ejs');
});

app.post('/register', (req, res) => {
    res.send('POST request to public/auth/register');
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

app.get('/plans', (req, res) => {
    res.render('plans.ejs');
});

app.post('/plans', (req, res) => {
    res.send('POST request to public/plans');
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


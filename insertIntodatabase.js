const express = require('express');
const ejs = require('ejs');
const mysql = require('mysql');
const fs = require('fs');
const validator = require('validator');

require('dotenv').config();

const app = express();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    charset: 'utf8mb4'
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
// Additional setup for Express and other functionalities as needed...

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
});

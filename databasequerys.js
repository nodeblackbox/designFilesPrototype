const mysql = require('mysql');
require('dotenv').config();
const fs = require('fs');
const outputFile = 'database_structure.txt';

// MySQL database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

// Connect to the MySQL server
db.connect(err => {
    if (err) {
        console.error('Error connecting to the MySQL Server:', err);
        return;
    }
    console.log('Connected to the MySQL Server');
});

// Function to run a query
function runQuery(query) {
    return new Promise((resolve, reject) => {
        db.query(query, (err, results, fields) => {
            if (err) {
                reject(err);
                return;
            }
            resolve({ results, fields });
        });
    });
}

// Function to show columns for each table
function writeToFile(data) {
    fs.appendFileSync(outputFile, data + '\n', 'utf8');
}

// Function to show columns for each table
async function showColumnsForAllTables() {
    try {
        const result = await runQuery('SHOW TABLES');
        const tables = result.results;

        for (const row of tables) {
            const tableName = row[Object.keys(row)[0]];
            writeToFile(`Table: ${tableName}`);
            const columnResult = await runQuery(`SHOW COLUMNS FROM ${tableName}`);
            const columns = columnResult.results;
            writeToFile('Columns: ' + JSON.stringify(columns));
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        db.end();
    }
}

showColumnsForAllTables();
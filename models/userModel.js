
/root/Databases_and_the_web / models / userModel.js
const db = require('../config/dbConfig');
const bcrypt = require('bcrypt');

exports.insert = (userData, callback) => {
	const query = "INSERT INTO users (username, password, email, role_id) VALUES (?, ?, ?, ?)";
	const defaultRoleId = 2; // assuming 'user' role has ID 2
	db.query(query, [userData.username, userData.password, userData.email, defaultRoleId], callback);
};

exports.getUserByUsername = (username, callback) => {
	const query = "SELECT * FROM users WHERE username = ?";
	db.query(query, [username], callback);
};

exports.getAllUsers = (callback) => {
	const query = "SELECT * FROM users";
	db.query(query, callback);
};

exports.getUserById = (id, callback) => {
	const query = "SELECT * FROM users WHERE user_id = ?";
	db.query(query, [id], callback);
};

exports.registerUser = function (userData, callback) {
	const plainPassword = PEPPER + userData.password;
	bcrypt.hash(plainPassword, saltRounds, function (err, hashedPassword) {
		if (err) return callback(err);

		const sqlquery = `
          INSERT INTO users (username, first_name, last_name, email, password, role_id)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
		const defaultRoleId = 2; // assuming 'user' role has ID 2
		db.query(sqlquery, [userData.username, userData.first_name, userData.last_name, userData.email, hashedPassword, defaultRoleId], callback);
	});
};


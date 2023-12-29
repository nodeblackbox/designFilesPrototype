const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const User = require('../models/userModel');

// const PEPPER = "someRandomPepperString";
// const saltRounds = 10;

exports.getAll = (req, res) => {
	User.getAllUsers((err, users) => {
		if (err) return res.status(500).send("Error fetching users");
		res.json(users);
	});
};

exports.add = (req, res) => {
	const userData = req.body;  // Ensure to validate before using.
	User.insert(userData, (err, result) => {
		if (err) return res.status(500).send("Error adding user");
		res.send("User added successfully!");
	});
};

exports.viewDetail = (req, res) => {
	const userId = req.params.id;
	User.getUserById(userId, (err, user) => {
		if (err) return res.status(500).send("Error fetching user details");
		res.json(user);
	});
};

exports.getLogin = (req, res) => {
	res.render('public/auth/login');
};

exports.postLogin = (req, res) => {
	// Logic for login using bcrypt and database validation goes here.
	res.send("Logged in");
};

exports.getRegister = (req, res) => {
	res.render('public/auth/register', { ...req.globalConfig.shopData });
};

exports.postRegister = (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const errorMessages = errors.array().map(error => {
			return {
				parameter: error.param,
				message: error.msg,
				value: error.value,
			};
		});
		return res.render('public/auth/register', { errors: errorMessages, ...req.globalConfig.shopData });
	}

	if (req.body.password !== req.body.retypePassword) {
		return res.render('public/auth/register', { errors: [{ message: 'Passwords do not match.' }], ...req.globalConfig.shopData });
	}

	const userData = {
		username: req.body.username,
		first_name: req.body.first,  // handle the first name
		last_name: req.body.last,    // handle the last name
		email: req.body.email,
		password: req.body.password
	};

	User.registerUser(userData, (err, result) => {
		if (err) {
			console.error("Error registering user:", err);
			return res.render('public/auth/register', { errors: [{ message: 'Error registering user.' }], ...req.globalConfig.shopData });
		}
		res.send('User registered successfully!');
	});
};

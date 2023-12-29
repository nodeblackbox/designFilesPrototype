// root/Databases_and_the_web/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');

router.get('/auth', authController.getAll);
router.get('/auth/add', authController.add);
router.get('/auth/:id', authController.viewDetail);
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);
router.get('/register', authController.getRegister);
router.post('/register', authController.postRegister);

module.exports = router;

// userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/user', userController.getAll);
router.get('/user/add', userController.add);
router.get('/user/:id', userController.viewDetail);

module.exports = router;

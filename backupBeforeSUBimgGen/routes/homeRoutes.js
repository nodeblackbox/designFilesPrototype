// homeRoutes.js
const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');

router.get('/home', homeController.getAll);
router.get('/home/add', homeController.add);
router.get('/home/:id', homeController.viewDetail);

module.exports = router;

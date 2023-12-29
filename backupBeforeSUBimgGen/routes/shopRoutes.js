// shopRoutes.js
const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');

router.get('/shop', shopController.getAll);
router.get('/shop/add', shopController.add);
router.get('/shop/:id', shopController.viewDetail);

module.exports = router;

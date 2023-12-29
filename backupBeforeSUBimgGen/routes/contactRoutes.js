// contactRoutes.js
const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

router.get('/contact', contactController.getAll);
router.get('/contact/add', contactController.add);
router.get('/contact/:id', contactController.viewDetail);

module.exports = router;

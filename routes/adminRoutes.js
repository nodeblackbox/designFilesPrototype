// adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/admin', adminController.getAll);
router.get('/admin/add', adminController.add);
router.get('/admin/:id', adminController.viewDetail);

module.exports = router;

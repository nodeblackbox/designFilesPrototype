// galleryRoutes.js
const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');

router.get('/gallery', galleryController.getAll);
router.get('/gallery/add', galleryController.add);
router.get('/gallery/:id', galleryController.viewDetail);

module.exports = router;

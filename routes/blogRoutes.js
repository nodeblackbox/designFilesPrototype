// blogRoutes.js
const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');

router.get('/blog', blogController.getAll);
router.get('/blog/add', blogController.add);
router.get('/blog/:id', blogController.viewDetail);

module.exports = router;

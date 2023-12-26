// coursesRoutes.js
const express = require('express');
const router = express.Router();
const coursesController = require('../controllers/coursesController');

router.get('/courses', coursesController.getAll);
router.get('/courses/add', coursesController.add);
router.get('/courses/:id', coursesController.viewDetail);

module.exports = router;

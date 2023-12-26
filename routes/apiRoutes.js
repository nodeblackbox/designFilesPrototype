// apiRoutes.js
const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');

router.get('/api', apiController.getAll);
router.get('/api/add', apiController.add);
router.get('/api/:id', apiController.viewDetail);

module.exports = router;

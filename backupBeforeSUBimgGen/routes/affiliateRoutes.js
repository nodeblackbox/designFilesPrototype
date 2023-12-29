// affiliateRoutes.js
const express = require('express');
const router = express.Router();
const affiliateController = require('../controllers/affiliateController');

router.get('/affiliate', affiliateController.getAll);
router.get('/affiliate/add', affiliateController.add);
router.get('/affiliate/:id', affiliateController.viewDetail);

module.exports = router;

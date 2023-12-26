// plansRoutes.js
const express = require('express');
const router = express.Router();
const plansController = require('../controllers/plansController');

router.get('/plans', plansController.getAll);
router.get('/plans/add', plansController.add);
router.get('/plans/:id', plansController.viewDetail);

module.exports = router;

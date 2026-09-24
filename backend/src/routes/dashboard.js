const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { getDashboardStats } = require('../controllers/dashboardController');

router.use(authMiddleware);
router.get('/stats', getDashboardStats);

module.exports = router;

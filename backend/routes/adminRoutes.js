const express = require('express');
const router = express.Router();
const { getUsers, toggleUser, getAnalytics, updateUserRole } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/users', getUsers);
router.put('/users/:id/toggle', toggleUser);
router.put('/users/:id/role', updateUserRole);
router.get('/analytics', getAnalytics);

module.exports = router;

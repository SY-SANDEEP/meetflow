const express = require('express');
const router = express.Router();
const { getSlots, getSlot, createSlot, updateSlot, deleteSlot, getAdminSlots } = require('../controllers/slotController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, getSlots);
router.get('/admin/all', protect, adminOnly, getAdminSlots);
router.get('/:id', protect, getSlot);
router.post('/', protect, adminOnly, createSlot);
router.put('/:id', protect, adminOnly, updateSlot);
router.delete('/:id', protect, adminOnly, deleteSlot);

module.exports = router;

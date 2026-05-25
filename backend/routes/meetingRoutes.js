const express = require('express');
const router = express.Router();
const { bookMeeting, getMyMeetings, cancelMeeting, rescheduleMeeting, getAllMeetings, getDashboardStats, getMeeting, updateMeetingStatus } = require('../controllers/meetingController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/stats', protect, getDashboardStats);
router.get('/my', protect, getMyMeetings);
router.get('/admin/all', protect, adminOnly, getAllMeetings);
router.post('/', protect, bookMeeting);
router.get('/:id', protect, getMeeting);
router.put('/:id/cancel', protect, cancelMeeting);
router.put('/:id/reschedule', protect, rescheduleMeeting);
router.put('/:id/status', protect, adminOnly, updateMeetingStatus);

module.exports = router;

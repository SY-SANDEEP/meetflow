const Meeting = require('../models/Meeting');
const Slot = require('../models/Slot');
const User = require('../models/User');
const { sendEmail, emailTemplates } = require('../utils/email');
const { createCalendarEvent, deleteCalendarEvent } = require('../utils/googleCalendar');

// @desc    Book a meeting
// @route   POST /api/meetings
const bookMeeting = async (req, res) => {
  try {
    const { slotId, title, description, agenda } = req.body;

    const slot = await Slot.findById(slotId);
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });

    if (slot.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'This slot has been cancelled' });
    }

    if (slot.bookedCount >= slot.capacity) {
      return res.status(400).json({ success: false, message: 'This slot is fully booked' });
    }

    if (new Date(slot.date) < new Date()) {
      return res.status(400).json({ success: false, message: 'Cannot book past slots' });
    }

    // Check if user already booked this slot
    const existingMeeting = await Meeting.findOne({
      slot: slotId,
      user: req.user._id,
      status: { $in: ['confirmed', 'pending'] }
    });

    if (existingMeeting) {
      return res.status(400).json({ success: false, message: 'You have already booked this slot' });
    }

    // Create meeting
    const meeting = await Meeting.create({
      slot: slotId,
      user: req.user._id,
      title: title || slot.title,
      description,
      agenda
    });

    // Update slot booking count
    slot.bookedCount += 1;
    if (slot.bookedCount >= slot.capacity) {
      slot.status = 'booked';
    }
    await slot.save();

    // Send confirmation email
    try {
      const emailData = emailTemplates.bookingConfirmation(meeting, slot, req.user);
      await sendEmail({ to: req.user.email, ...emailData });
    } catch (emailErr) {
      console.error('Email failed:', emailErr.message);
    }

    // Add to Google Calendar if user has connected
    const userWithTokens = await User.findById(req.user._id).select('+googleCalendarToken');
    if (userWithTokens.googleCalendarToken?.accessToken) {
      const slotDate = new Date(slot.date);
      const [startH, startM] = slot.startTime.split(':');
      const [endH, endM] = slot.endTime.split(':');

      const startDateTime = new Date(slotDate);
      startDateTime.setHours(parseInt(startH), parseInt(startM), 0);
      const endDateTime = new Date(slotDate);
      endDateTime.setHours(parseInt(endH), parseInt(endM), 0);

      const calResult = await createCalendarEvent(userWithTokens.googleCalendarToken, {
        title: meeting.title,
        description: meeting.description,
        location: slot.location,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        attendees: [{ email: req.user.email }]
      });

      if (calResult.success) {
        await Meeting.findByIdAndUpdate(meeting._id, { googleCalendarEventId: calResult.eventId });
      }
    }

    const populatedMeeting = await Meeting.findById(meeting._id).populate('slot').populate('user', 'name email');
    res.status(201).json({ success: true, meeting: populatedMeeting, message: 'Meeting booked successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's meetings
// @route   GET /api/meetings/my
const getMyMeetings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { user: req.user._id };
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const total = await Meeting.countDocuments(query);
    const meetings = await Meeting.find(query)
      .populate('slot')
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ success: true, meetings, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel meeting
// @route   PUT /api/meetings/:id/cancel
const cancelMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id).populate('slot');
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

    if (meeting.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (meeting.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Meeting already cancelled' });
    }

    meeting.status = 'cancelled';
    meeting.cancellationReason = req.body.reason || '';
    await meeting.save();

    // Free up the slot
    const slot = await Slot.findById(meeting.slot._id);
    if (slot) {
      slot.bookedCount = Math.max(0, slot.bookedCount - 1);
      if (slot.status === 'booked' && slot.bookedCount < slot.capacity) {
        slot.status = 'available';
      }
      await slot.save();
    }

    // Send cancellation email
    try {
      const user = await User.findById(meeting.user);
      const emailData = emailTemplates.cancellationNotice(meeting, meeting.slot, user);
      await sendEmail({ to: user.email, ...emailData });
    } catch (e) {
      console.error('Cancellation email failed:', e.message);
    }

    res.json({ success: true, message: 'Meeting cancelled', meeting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reschedule meeting
// @route   PUT /api/meetings/:id/reschedule
const rescheduleMeeting = async (req, res) => {
  try {
    const { newSlotId } = req.body;
    const meeting = await Meeting.findById(req.params.id).populate('slot');

    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    if (meeting.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (['cancelled', 'completed'].includes(meeting.status)) {
      return res.status(400).json({ success: false, message: 'Cannot reschedule a cancelled or completed meeting' });
    }

    const newSlot = await Slot.findById(newSlotId);
    if (!newSlot) return res.status(404).json({ success: false, message: 'New slot not found' });
    if (newSlot.bookedCount >= newSlot.capacity) {
      return res.status(400).json({ success: false, message: 'New slot is fully booked' });
    }
    if (new Date(newSlot.date) < new Date()) {
      return res.status(400).json({ success: false, message: 'Cannot reschedule to a past slot' });
    }

    // Cancel old meeting
    const oldSlot = meeting.slot;
    meeting.status = 'rescheduled';
    await meeting.save();

    // Free old slot
    const oldSlotDoc = await Slot.findById(oldSlot._id);
    if (oldSlotDoc) {
      oldSlotDoc.bookedCount = Math.max(0, oldSlotDoc.bookedCount - 1);
      if (oldSlotDoc.status === 'booked') oldSlotDoc.status = 'available';
      await oldSlotDoc.save();
    }

    // Create new meeting
    const newMeeting = await Meeting.create({
      slot: newSlotId,
      user: req.user._id,
      title: meeting.title,
      description: meeting.description,
      agenda: meeting.agenda,
      rescheduledFrom: meeting._id
    });

    meeting.rescheduledTo = newMeeting._id;
    await meeting.save();

    // Update new slot
    newSlot.bookedCount += 1;
    if (newSlot.bookedCount >= newSlot.capacity) newSlot.status = 'booked';
    await newSlot.save();

    // Send reschedule email
    try {
      const emailData = emailTemplates.rescheduleNotice(newMeeting, oldSlot, newSlot, req.user);
      await sendEmail({ to: req.user.email, ...emailData });
    } catch (e) {
      console.error('Reschedule email failed:', e.message);
    }

    const populated = await Meeting.findById(newMeeting._id).populate('slot').populate('user', 'name email');
    res.json({ success: true, message: 'Meeting rescheduled successfully', meeting: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all meetings (Admin)
// @route   GET /api/meetings/admin/all
const getAllMeetings = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const total = await Meeting.countDocuments(query);
    const meetings = await Meeting.find(query)
      .populate('slot')
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ success: true, meetings, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/meetings/stats
const getDashboardStats = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const userFilter = isAdmin ? {} : { user: req.user._id };

    const [totalMeetings, confirmedMeetings, cancelledMeetings, completedMeetings, upcomingMeetings] = await Promise.all([
      Meeting.countDocuments(userFilter),
      Meeting.countDocuments({ ...userFilter, status: 'confirmed' }),
      Meeting.countDocuments({ ...userFilter, status: 'cancelled' }),
      Meeting.countDocuments({ ...userFilter, status: 'completed' }),
      Meeting.countDocuments({
        ...userFilter,
        status: 'confirmed',
        createdAt: { $gte: new Date() }
      })
    ]);

    let adminStats = {};
    if (isAdmin) {
      const totalSlots = await Slot.countDocuments();
      const availableSlots = await Slot.countDocuments({ status: 'available' });
      const bookedSlots = await Slot.countDocuments({ status: 'booked' });
      const totalUsers = await User.countDocuments({ role: 'user' });

      adminStats = { totalSlots, availableSlots, bookedSlots, totalUsers };
    }

    // Recent meetings
    const recentMeetings = await Meeting.find(userFilter)
      .populate('slot')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        totalMeetings,
        confirmedMeetings,
        cancelledMeetings,
        completedMeetings,
        upcomingMeetings,
        ...adminStats
      },
      recentMeetings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single meeting
// @route   GET /api/meetings/:id
const getMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id).populate('slot').populate('user', 'name email avatar');
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

    if (meeting.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, meeting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin update meeting status
// @route   PUT /api/meetings/:id/status
const updateMeetingStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      { status, notes },
      { new: true }
    ).populate('slot').populate('user', 'name email');

    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    res.json({ success: true, meeting, message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { bookMeeting, getMyMeetings, cancelMeeting, rescheduleMeeting, getAllMeetings, getDashboardStats, getMeeting, updateMeetingStatus };

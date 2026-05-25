const Slot = require('../models/Slot');
const Meeting = require('../models/Meeting');

// @desc    Get all available slots (public)
// @route   GET /api/slots
const getSlots = async (req, res) => {
  try {
    const { date, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.date = { $gte: start, $lt: end };
    }

    if (status) {
      query.status = status;
    } else {
      // Show available and future slots by default for users
      query.date = { $gte: new Date() };
    }

    const skip = (page - 1) * limit;
    const total = await Slot.countDocuments(query);
    const slots = await Slot.find(query)
      .populate('createdBy', 'name email')
      .sort({ date: 1, startTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: slots.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      slots
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single slot
// @route   GET /api/slots/:id
const getSlot = async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id).populate('createdBy', 'name email');
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });
    res.json({ success: true, slot });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create slot (Admin)
// @route   POST /api/slots
const createSlot = async (req, res) => {
  try {
    const { title, description, date, startTime, endTime, duration, capacity, location, meetingType, meetingLink } = req.body;

    // Check for time conflicts on same date
    const existingSlot = await Slot.findOne({
      date: { $eq: new Date(date) },
      status: { $ne: 'cancelled' },
      $or: [
        { startTime: { $lt: endTime, $gte: startTime } },
        { endTime: { $gt: startTime, $lte: endTime } },
        { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
      ]
    });

    if (existingSlot) {
      return res.status(400).json({ success: false, message: 'Time slot conflicts with an existing slot' });
    }

    const slot = await Slot.create({
      title, description, date, startTime, endTime,
      duration: duration || 30, capacity: capacity || 1,
      location, meetingType, meetingLink,
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, slot, message: 'Slot created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update slot (Admin)
// @route   PUT /api/slots/:id
const updateSlot = async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id);
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });

    if (slot.bookedCount > 0 && req.body.date) {
      return res.status(400).json({ success: false, message: 'Cannot change date of a booked slot' });
    }

    const updated = await Slot.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, slot: updated, message: 'Slot updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete slot (Admin)
// @route   DELETE /api/slots/:id
const deleteSlot = async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id);
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });

    if (slot.bookedCount > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete a slot with active bookings. Cancel meetings first.' });
    }

    await slot.deleteOne();
    res.json({ success: true, message: 'Slot deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all slots (Admin - all statuses)
// @route   GET /api/slots/admin/all
const getAdminSlots = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) query.title = { $regex: search, $options: 'i' };

    const skip = (page - 1) * limit;
    const total = await Slot.countDocuments(query);
    const slots = await Slot.find(query)
      .populate('createdBy', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ success: true, slots, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getSlots, getSlot, createSlot, updateSlot, deleteSlot, getAdminSlots };

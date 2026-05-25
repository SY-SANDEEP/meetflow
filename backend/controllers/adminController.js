const User = require('../models/User');
const Meeting = require('../models/Meeting');
const Slot = require('../models/Slot');

// @desc    Get all users
// @route   GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const query = {};
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    if (role) query.role = role;

    const skip = (page - 1) * limit;
    const total = await User.countDocuments(query);
    const users = await User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));

    res.json({ success: true, users, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/toggle
const toggleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, user, message: `User ${user.isActive ? 'activated' : 'deactivated'}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get admin analytics
// @route   GET /api/admin/analytics
const getAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const [
      totalUsers, totalMeetings, totalSlots,
      meetingsThisMonth, meetingsThisWeek,
      slotsByStatus, meetingsByStatus,
      recentUsers
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Meeting.countDocuments(),
      Slot.countDocuments(),
      Meeting.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Meeting.countDocuments({ createdAt: { $gte: startOfWeek } }),
      Slot.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Meeting.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(5).select('name email createdAt')
    ]);

    // Monthly meeting trend (last 6 months)
    const monthlyTrend = await Meeting.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) }
        }
      },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      analytics: {
        totalUsers, totalMeetings, totalSlots,
        meetingsThisMonth, meetingsThisWeek,
        slotsByStatus, meetingsByStatus,
        monthlyTrend, recentUsers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Promote user to admin
// @route   PUT /api/admin/users/:id/role
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user, message: `User role updated to ${role}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getUsers, toggleUser, getAnalytics, updateUserRole };

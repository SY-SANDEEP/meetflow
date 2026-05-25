const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  slot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Slot',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Meeting title is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  agenda: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'rescheduled'],
    default: 'confirmed'
  },
  cancellationReason: {
    type: String,
    default: ''
  },
  rescheduledFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
    default: null
  },
  rescheduledTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
    default: null
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  googleCalendarEventId: {
    type: String,
    default: ''
  },
  attendees: [{
    name: String,
    email: String
  }],
  notes: {
    type: String,
    default: ''
  },
  bookedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Meeting', meetingSchema);

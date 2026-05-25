const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Slot title is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required']
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  capacity: {
    type: Number,
    default: 1
  },
  bookedCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['available', 'booked', 'cancelled', 'completed'],
    default: 'available'
  },
  location: {
    type: String,
    default: 'Online'
  },
  meetingType: {
    type: String,
    enum: ['video', 'phone', 'in-person'],
    default: 'video'
  },
  meetingLink: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  googleCalendarEventId: {
    type: String,
    default: ''
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', ''],
    default: ''
  }
}, { timestamps: true });

// Virtual to check if slot is fully booked
slotSchema.virtual('isFullyBooked').get(function() {
  return this.bookedCount >= this.capacity;
});

slotSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Slot', slotSchema);

require('dotenv').config();
const mongoose = require('mongoose');
const User    = require('./models/User');
const Slot    = require('./models/Slot');
const Meeting = require('./models/Meeting');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/meetflow');
  console.log('Connected to MongoDB');

  // Cleanup
  await Promise.all([User.deleteMany(), Slot.deleteMany(), Meeting.deleteMany()]);
  console.log('Cleaned existing data');

  // Admin
  const admin = await User.create({
    name: 'Admin User', email: 'admin@meetflow.com', password: 'admin123', role: 'admin'
  });

  // Regular users
  const users = await User.create([
    { name: 'Alice Johnson', email: 'alice@example.com', password: 'password123' },
    { name: 'Bob Smith',     email: 'bob@example.com',   password: 'password123' },
    { name: 'Carol White',   email: 'carol@example.com', password: 'password123' },
  ]);

  // Slots (next 2 weeks)
  const slotData = [];
  const types = ['video', 'phone', 'in-person'];
  const titles = ['Discovery Call', 'Product Demo', 'Strategy Session', 'Onboarding Call', 'Consultation', 'Feedback Review'];

  for (let d = 1; d <= 14; d++) {
    const date = new Date();
    date.setDate(date.getDate() + d);
    if (date.getDay() === 0 || date.getDay() === 6) continue; // skip weekends

    const times = [['09:00','09:30'],['10:00','10:45'],['11:00','12:00'],['14:00','14:30'],['15:00','16:00'],['16:30','17:00']];

    for (const [start, end] of times.slice(0, 3 + Math.floor(Math.random() * 3))) {
      slotData.push({
        title: titles[Math.floor(Math.random() * titles.length)],
        description: 'A brief meeting to discuss next steps.',
        date: new Date(date.toDateString()),
        startTime: start, endTime: end,
        duration: 30,
        capacity: Math.random() > 0.7 ? 2 : 1,
        location: Math.random() > 0.5 ? 'Online' : 'Conference Room A',
        meetingType: types[Math.floor(Math.random() * types.length)],
        meetingLink: 'https://meet.google.com/demo-link',
        createdBy: admin._id,
        status: 'available'
      });
    }
  }

  const slots = await Slot.insertMany(slotData);
  console.log(`Created ${slots.length} slots`);

  // Book some meetings
  const meetingData = [];
  const statuses = ['confirmed', 'confirmed', 'confirmed', 'cancelled', 'completed'];

  for (let i = 0; i < Math.min(8, slots.length); i++) {
    const user  = users[i % users.length];
    const slot  = slots[i];
    const status = statuses[i % statuses.length];

    meetingData.push({ slot: slot._id, user: user._id, title: slot.title, description: 'Booked via seed', status });

    if (['confirmed', 'completed'].includes(status)) {
      slot.bookedCount += 1;
      if (slot.bookedCount >= slot.capacity) slot.status = 'booked';
      await slot.save();
    }
  }

  await Meeting.insertMany(meetingData);
  console.log(`Created ${meetingData.length} meetings`);

  console.log('\n✅ Seed complete!');
  console.log('Admin:  admin@meetflow.com / admin123');
  console.log('User 1: alice@example.com / password123');
  console.log('User 2: bob@example.com   / password123');

  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });

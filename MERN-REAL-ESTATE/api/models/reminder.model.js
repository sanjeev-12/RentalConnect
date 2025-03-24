import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue'],
    default: 'pending'
  },
  remindersSent: {
    type: Number,
    default: 0
  },
  lastReminderSent: {
    type: Date
  },
  emailNotification: {
    type: Boolean,
    default: true
  },
  reminderDays: {
    type: Number,
    default: 3,
    min: 1,
    max: 30
  },
  nextReminderDate: {
    type: Date
  },
  message: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Calculate the next reminder date based on the due date and reminderDays
reminderSchema.pre('save', function(next) {
  if (this.dueDate && this.reminderDays) {
    // Create a copy of the due date
    const dueDateCopy = new Date(this.dueDate);
    // Subtract the reminder days to get the next reminder date
    dueDateCopy.setDate(dueDateCopy.getDate() - this.reminderDays);
    this.nextReminderDate = dueDateCopy;
  }
  next();
});

const Reminder = mongoose.model('Reminder', reminderSchema);

export default Reminder;

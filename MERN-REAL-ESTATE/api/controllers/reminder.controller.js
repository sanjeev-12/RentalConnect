import Reminder from '../models/reminder.model.js';
import Booking from '../models/booking.model.js';
import { errorHandler } from '../utils/error.js';
import nodemailer from 'nodemailer';

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Create rent reminder
export const createRentReminder = async (req, res, next) => {
  try {
    const { bookingId, dueDate, amount, emailNotification, reminderDays, message } = req.body;
    
    // Get booking details
    const booking = await Booking.findById(bookingId)
      .populate('listingId')
      .populate('tenantId');
    
    if (!booking) {
      return next(errorHandler(404, 'Booking not found'));
    }

    const reminder = await Reminder.create({
      bookingId,
      tenantId: booking.tenantId._id,
      ownerId: booking.listingId.userRef,
      listingId: booking.listingId._id,
      dueDate,
      amount,
      emailNotification: emailNotification !== undefined ? emailNotification : true,
      reminderDays: reminderDays || 3,
      message: message || ''
    });

    // If emailNotification is enabled, send a confirmation email
    if (reminder.emailNotification) {
      try {
        await sendReminderSetupEmail(reminder, booking);
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't fail the request if email sending fails
      }
    }

    res.status(201).json(reminder);
  } catch (error) {
    console.error('Error creating reminder:', error);
    next(error);
  }
};

// Get reminders for tenant
export const getTenantReminders = async (req, res, next) => {
  try {
    const reminders = await Reminder.find({ tenantId: req.user.id })
      .populate('listingId', 'name address imageUrls')
      .populate('ownerId', 'username email')
      .sort({ dueDate: 1 });
    res.status(200).json(reminders);
  } catch (error) {
    next(error);
  }
};

// Get reminders for owner
export const getOwnerReminders = async (req, res, next) => {
  try {
    const reminders = await Reminder.find({ ownerId: req.user.id })
      .populate('listingId', 'name address imageUrls')
      .populate('tenantId', 'username email')
      .sort({ dueDate: 1 });
    res.status(200).json(reminders);
  } catch (error) {
    next(error);
  }
};

// Update reminder status
export const updateReminderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'paid', 'overdue'].includes(status)) {
      return next(errorHandler(400, 'Invalid status value'));
    }
    
    const reminder = await Reminder.findById(id);
    
    if (!reminder) {
      return next(errorHandler(404, 'Reminder not found'));
    }
    
    // Only allow tenant or owner to update status
    if (reminder.tenantId.toString() !== req.user.id && reminder.ownerId.toString() !== req.user.id) {
      return next(errorHandler(403, 'You do not have permission to update this reminder'));
    }
    
    reminder.status = status;
    await reminder.save();
    
    res.status(200).json({ success: true, message: 'Reminder status updated' });
  } catch (error) {
    next(error);
  }
};

// Check and update overdue reminders
export const checkOverdueReminders = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find all pending reminders with due dates before today
    const overdueReminders = await Reminder.find({
      status: 'pending',
      dueDate: { $lt: today }
    });
    
    for (const reminder of overdueReminders) {
      reminder.status = 'overdue';
      await reminder.save();
      
      // Send overdue notification if email notifications are enabled
      if (reminder.emailNotification) {
        try {
          await sendOverdueEmail(reminder);
        } catch (error) {
          console.error(`Failed to send overdue email for reminder ${reminder._id}:`, error);
        }
      }
    }
    
    console.log(`Updated ${overdueReminders.length} reminders to overdue status`);
  } catch (error) {
    console.error('Error checking overdue reminders:', error);
  }
};

// Send rent reminders
export const sendRentReminders = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find reminders that are due for a reminder today
    const remindersToSend = await Reminder.find({
      status: 'pending',
      nextReminderDate: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      },
      emailNotification: true
    })
    .populate('tenantId', 'username email')
    .populate('listingId', 'name address');
    
    console.log(`Found ${remindersToSend.length} reminders to send today`);
    
    for (const reminder of remindersToSend) {
      try {
        await sendReminderEmail(reminder);
        
        // Update reminder tracking fields
        reminder.remindersSent += 1;
        reminder.lastReminderSent = new Date();
        await reminder.save();
      } catch (error) {
        console.error(`Failed to send reminder for ${reminder._id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error sending rent reminders:', error);
  }
};

// Helper function to send reminder setup confirmation email
const sendReminderSetupEmail = async (reminder, booking) => {
  const tenant = booking.tenantId;
  const listing = booking.listingId;
  
  if (!tenant.email) {
    throw new Error('Tenant email not found');
  }
  
  const dueDate = new Date(reminder.dueDate).toLocaleDateString();
  const reminderDate = new Date(reminder.nextReminderDate).toLocaleDateString();
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: tenant.email,
    subject: 'Rent Reminder Set Up Successfully',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #4a5568;">Rent Reminder Confirmation</h2>
        <p>Hello ${tenant.username || 'Tenant'},</p>
        <p>Your rent reminder has been set up successfully for the property at <strong>${listing.address}</strong>.</p>
        
        <div style="background-color: #f7fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Property:</strong> ${listing.name}</p>
          <p style="margin: 5px 0;"><strong>Amount:</strong> ₹${reminder.amount.toLocaleString()}</p>
          <p style="margin: 5px 0;"><strong>Due Date:</strong> ${dueDate}</p>
          <p style="margin: 5px 0;"><strong>You will be reminded on:</strong> ${reminderDate}</p>
          ${reminder.message ? `<p style="margin: 15px 0; font-style: italic; padding: 10px; background-color: #ebf8ff; border-left: 4px solid #4299e1; border-radius: 2px;">${reminder.message}</p>` : ''}
        </div>
        
        <p>You will receive a reminder email ${reminder.reminderDays} days before your due date.</p>
        
        <p>Thanks for using our service!</p>
        <p style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #718096;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `
  };
  
  return transporter.sendMail(mailOptions);
};

// Helper function to send reminder email
const sendReminderEmail = async (reminder) => {
  const tenant = reminder.tenantId;
  const listing = reminder.listingId;
  
  if (!tenant.email) {
    throw new Error('Tenant email not found');
  }
  
  const dueDate = new Date(reminder.dueDate).toLocaleDateString();
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: tenant.email,
    subject: 'Rent Payment Reminder',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #4a5568;">Rent Payment Reminder</h2>
        <p>Hello ${tenant.username || 'Tenant'},</p>
        <p>This is a friendly reminder that your rent payment is due in ${reminder.reminderDays} days.</p>
        
        <div style="background-color: #f7fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Property:</strong> ${listing.name || listing.address}</p>
          <p style="margin: 5px 0;"><strong>Amount Due:</strong> ₹${reminder.amount.toLocaleString()}</p>
          <p style="margin: 5px 0;"><strong>Due Date:</strong> ${dueDate}</p>
          ${reminder.message ? `<p style="margin: 15px 0; font-style: italic; padding: 10px; background-color: #ebf8ff; border-left: 4px solid #4299e1; border-radius: 2px;">${reminder.message}</p>` : ''}
        </div>
        
        <p>Please ensure your payment is made on time to avoid any late fees.</p>
        
        <p>Thank you!</p>
        <p style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #718096;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `
  };
  
  return transporter.sendMail(mailOptions);
};

// Helper function to send overdue email
const sendOverdueEmail = async (reminder) => {
  // Fetch related data
  const reminderWithDetails = await Reminder.findById(reminder._id)
    .populate('tenantId', 'username email')
    .populate('listingId', 'name address');
  
  const tenant = reminderWithDetails.tenantId;
  const listing = reminderWithDetails.listingId;
  
  if (!tenant.email) {
    throw new Error('Tenant email not found');
  }
  
  const dueDate = new Date(reminder.dueDate).toLocaleDateString();
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: tenant.email,
    subject: 'OVERDUE: Rent Payment Required Immediately',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e63946; border-radius: 5px;">
        <h2 style="color: #e63946;">Overdue Rent Payment</h2>
        <p>Hello ${tenant.username || 'Tenant'},</p>
        <p>Your rent payment for the property at <strong>${listing.address}</strong> is overdue.</p>
        
        <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Property:</strong> ${listing.name || listing.address}</p>
          <p style="margin: 5px 0;"><strong>Amount Due:</strong> ₹${reminder.amount.toLocaleString()}</p>
          <p style="margin: 5px 0;"><strong>Due Date:</strong> ${dueDate} (PAST DUE)</p>
          ${reminder.message ? `<p style="margin: 15px 0; font-style: italic; padding: 10px; background-color: #fff5f5; border-left: 4px solid #e63946; border-radius: 2px;">${reminder.message}</p>` : ''}
        </div>
        
        <p>Please make your payment as soon as possible to avoid additional late fees or potential issues with your tenancy.</p>
        
        <p>If you have already made the payment, please disregard this message.</p>
        
        <p>Thank you for your prompt attention to this matter.</p>
        <p style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #718096;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `
  };
  
  return transporter.sendMail(mailOptions);
};

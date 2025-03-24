import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import {
  createRentReminder,
  getTenantReminders,
  getOwnerReminders,
  updateReminderStatus
} from '../controllers/reminder.controller.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Create a new rent reminder
router.post('/create', createRentReminder);

// Get reminders for tenant
router.get('/tenant', getTenantReminders);

// Get reminders for owner
router.get('/owner', getOwnerReminders);

// Update reminder status
router.put('/:id/status', updateReminderStatus);

export default router;

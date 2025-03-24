import cron from 'node-cron';
import { checkOverdueReminders, sendRentReminders } from '../controllers/reminder.controller.js';

// Run at midnight every day (00:00)
export const initializeReminderCronJobs = () => {
  // Check for overdue reminders daily at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily overdue reminder check...');
    try {
      await checkOverdueReminders();
      console.log('Completed overdue reminder check');
    } catch (error) {
      console.error('Error in overdue reminder check:', error);
    }
  });

  // Send rent reminders daily at 9 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('Sending daily rent reminders...');
    try {
      await sendRentReminders();
      console.log('Completed sending rent reminders');
    } catch (error) {
      console.error('Error sending rent reminders:', error);
    }
  });
};

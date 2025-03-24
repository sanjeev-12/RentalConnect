import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  initialize() {
    if (this.initialized) return true;
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('Email configuration is missing. Please check your .env file.');
      return false;
    }

    try {
      console.log('Initializing email service with:', process.env.EMAIL_USER);

      // Configure transporter with Gmail settings - Using port 587 (TLS) instead of 465 (SSL)
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // Use TLS
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD // This should be an App Password
        },
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 10000,   // 10 seconds
        socketTimeout: 15000,     // 15 seconds
        debug: true,
        logger: true
      });

      // Verify connection configuration
      return this.verifyConnection();
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      return false;
    }
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('SMTP connection verified successfully');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('SMTP connection verification failed:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.message.includes('Invalid login')) {
        console.error('Please ensure you are using an App Password for Gmail.');
        console.error('To generate an App Password:');
        console.error('1. Go to your Google Account settings');
        console.error('2. Enable 2-Step Verification if not already enabled');
        console.error('3. Go to Security > App passwords');
        console.error('4. Generate a new App Password for your application');
      }
      
      if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKET') {
        console.error('Connection timed out. This could be due to:');
        console.error('1. Network firewall blocking outgoing SMTP connections');
        console.error('2. VPN or proxy settings interfering with the connection');
        console.error('3. Gmail service might be temporarily unavailable');
      }
      
      return false;
    }
  }

  async sendMailWithRetry(mailOptions, retryCount = 0) {
    try {
      // Always verify connection before sending
      if (!this.initialized || !(await this.verifyConnection())) {
        console.error('Email service not properly initialized. Attempting to reinitialize...');
        if (!this.initialize()) {
          throw new Error('Failed to initialize email service');
        }
      }

      // Add default from name if not specified
      if (!mailOptions.from || typeof mailOptions.from === 'string') {
        mailOptions.from = {
          name: 'RentalConnect',
          address: process.env.EMAIL_USER
        };
      }

      console.log('Attempting to send email to:', mailOptions.to);
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      this.retryCount = 0; // Reset retry count on success
      return true;
    } catch (error) {
      console.error(`Error sending email (attempt ${retryCount + 1}/${this.maxRetries}):`, error);
      console.error('Error details:', error.message);
      console.error('Error code:', error.code);
      
      if (retryCount < this.maxRetries - 1) {
        const delay = Math.min((retryCount + 1) * 2000, 5000); // Exponential backoff with 5s max
        console.log(`Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendMailWithRetry(mailOptions, retryCount + 1);
      }
      
      throw error;
    }
  }

  async sendBookingNotification(ownerEmail, listingDetails, tenantDetails) {
    if (!this.initialized) {
      if (!this.initialize()) {
        console.error('Could not initialize email service');
        return false;
      }
    }

    try {
      console.log('Sending booking notification email to:', ownerEmail);
      console.log('From email:', process.env.EMAIL_USER);
      
      const mailOptions = {
        from: {
          name: 'RentalConnect',
          address: process.env.EMAIL_USER
        },
        to: ownerEmail,
        subject: 'New Property Booking Request',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px;">New Booking Request</h2>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #2c3e50; margin-top: 0;">Property Details:</h3>
              <p><strong>Property Name:</strong> ${listingDetails.name || 'N/A'}</p>
              <p><strong>Address:</strong> ${listingDetails.address || 'N/A'}</p>
              <p><strong>Type:</strong> ${listingDetails.type || 'N/A'}</p>
              <p><strong>Price:</strong> $${listingDetails.regularPrice || 'N/A'}</p>
            </div>

            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #2c3e50; margin-top: 0;">Tenant Details:</h3>
              <p><strong>Name:</strong> ${tenantDetails.name || 'N/A'}</p>
              <p><strong>Email:</strong> ${tenantDetails.email || 'N/A'}</p>
              <p><strong>Phone:</strong> ${tenantDetails.phone || 'N/A'}</p>
            </div>

            <div style="margin-top: 20px; padding: 15px; border-top: 1px solid #eee;">
              <p>Please log in to your RentalConnect account to review and respond to this booking request.</p>
              <p style="color: #666;">This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        `
      };

      return await this.sendMailWithRetry(mailOptions);
    } catch (error) {
      console.error('Error in sendBookingNotification:', error);
      return false;
    }
  }

  async sendBookingApprovalNotification(tenantEmail, listingDetails, bookingDetails) {
    if (!this.initialized) {
      if (!this.initialize()) {
        console.error('Could not initialize email service');
        return false;
      }
    }

    try {
      console.log('Sending booking approval notification to tenant:', tenantEmail);
      
      const mailOptions = {
        from: {
          name: 'RentalConnect',
          address: process.env.EMAIL_USER
        },
        to: tenantEmail,
        subject: 'Your Property Booking Has Been Approved!',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px;">Booking Approved!</h2>
            
            <p style="font-size: 16px; color: #333;">Congratulations! Your booking request has been approved by the property owner.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #2c3e50; margin-top: 0;">Property Details:</h3>
              <p><strong>Property Name:</strong> ${listingDetails.name || 'N/A'}</p>
              <p><strong>Address:</strong> ${listingDetails.address || 'N/A'}</p>
              <p><strong>Type:</strong> ${listingDetails.type || 'N/A'}</p>
              <p><strong>Price:</strong> $${listingDetails.regularPrice || 'N/A'}</p>
            </div>

            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #2c3e50; margin-top: 0;">Booking Details:</h3>
              <p><strong>Booking ID:</strong> ${bookingDetails.id || 'N/A'}</p>
              <p><strong>Status:</strong> <span style="color: #27ae60; font-weight: bold;">APPROVED</span></p>
              <p><strong>Booking Date:</strong> ${new Date(bookingDetails.createdAt).toLocaleDateString() || 'N/A'}</p>
            </div>

            <div style="margin-top: 20px; padding: 15px; border-top: 1px solid #eee;">
              <p>You can log in to your RentalConnect account anytime to view the details of your booking.</p>
              <p>If you have any questions, please contact the property owner directly.</p>
              <p style="color: #666;">This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        `
      };

      return await this.sendMailWithRetry(mailOptions);
    } catch (error) {
      console.error('Error in sendBookingApprovalNotification:', error);
      return false;
    }
  }
}

// Create and export a singleton instance
const emailService = new EmailService();
export default emailService;

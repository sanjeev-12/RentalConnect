import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv with the correct path
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Successfully!');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Username:', existingAdmin.username);
      console.log('Email:', existingAdmin.email);
      console.log('Password: (hidden for security)');
      process.exit(0);
    }

    // Admin credentials
    const adminData = {
      username: 'admin',
      email: 'admin@realestate.com',
      password: 'admin123',
      role: 'admin',
      avatar: 'https://t4.ftcdn.net/jpg/05/09/59/75/240_F_509597532_RKUuYsERhODmkxkZd82pSHnFtDAtgbzJ.jpg'
    };

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminData.password, salt);

    // Create new admin user
    const newAdmin = new User({
      ...adminData,
      password: hashedPassword
    });

    // Save admin user to database
    await newAdmin.save();

    console.log('Admin user created successfully!');
    console.log('Username:', adminData.username);
    console.log('Email:', adminData.email);
    console.log('Password:', adminData.password);
    console.log('\nYou can now log in with these credentials.');

  } catch (error) {
    console.error('Error creating admin user:', error.message);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    process.exit(0);
  }
};

// Execute the function
createAdminUser();

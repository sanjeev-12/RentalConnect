import dotenv from 'dotenv';
import fs from 'fs';

// Attempt to load environment variables
dotenv.config();

console.log('Testing environment variables:');
console.log({
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET ? '[SECRET HIDDEN]' : 'undefined',
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? '[PASSWORD HIDDEN]' : 'undefined'
});

// Try to read .env file directly
console.log('\nReading .env file directly:');
try {
  const envFile = fs.readFileSync('./.env', 'utf8');
  console.log('File exists, content length:', envFile.length);
  
  // Parse file line by line to check format
  const lines = envFile.split('\n');
  console.log('Number of lines:', lines.length);
  
  // Create manually parsed values
  const parsedValues = {};
  lines.forEach(line => {
    if (line && !line.startsWith('#')) {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        // Join all remaining parts with '=' in case value contains =
        const value = parts.slice(1).join('=').trim();
        // Remove surrounding quotes if present
        const cleanValue = value.replace(/^["'](.+)["']$/, '$1');
        parsedValues[key] = cleanValue;
      }
    }
  });
  
  console.log('Manually parsed values:');
  console.log({
    MONGO_URI: parsedValues.MONGO_URI,
    JWT_SECRET: parsedValues.JWT_SECRET ? '[SECRET HIDDEN]' : 'undefined',
    EMAIL_USER: parsedValues.EMAIL_USER,
    EMAIL_PASSWORD: parsedValues.EMAIL_PASSWORD ? '[PASSWORD HIDDEN]' : 'undefined'
  });
} catch (error) {
  console.error('Error reading .env file:', error.message);
}

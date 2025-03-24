import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
import { Server } from "socket.io";
import http from "http";
import fs from 'fs';

// Define __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load from properly formatted env file if it exists
if (fs.existsSync(path.resolve(__dirname, '.env.proper'))) {
  dotenv.config({ path: path.resolve(__dirname, '.env.proper') });
  console.log('Loaded environment from .env.proper');
} else {
  dotenv.config();
  console.log('Loaded environment from default .env');
}

// Debug environment variables
console.log('Environment Variables:');
console.log({
  MONGO_URI: process.env.MONGO_URI,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_CONFIG: process.env.EMAIL_USER ? 'Configured' : 'Not Configured'
});

import express from "express";
import mongoose from "mongoose";
import userRouter from "./routes/user.route.js";
import authRouter from "./routes/auth.route.js";
import listingRouter from "./routes/listing.route.js";
import cookieParser from "cookie-parser";
import chatRouter from "./routes/chat.route.js";
import bookingRouter from './routes/booking.route.js';
import adminRouter from './routes/admin.route.js';
import reviewRouter from './routes/review.route.js';
import reminderRouter from './routes/reminder.route.js';
import { initializeReminderCronJobs } from './utils/cronJobs.js';

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB Successfully!");
  })
  .catch((err) => {
    console.log(err);
  });

const app = express();
const server = http.createServer(app);
const io = new Server(server);

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("sendMessage", (message) => {
    io.emit("receiveMessage", message);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

app.use(express.json());
app.use(cookieParser());

const port = 3001;  
server.listen(port, () => {
  console.log(`Server running on port: ${port}!`);
});

app.use("/api/user", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/listing", listingRouter);
app.use("/api/chat", chatRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/admin', adminRouter);
app.use('/api/review', reviewRouter);
app.use('/api/reminder', reminderRouter);

// Initialize cron jobs for automated reminders
initializeReminderCronJobs();

// ErrorHandler MiddleWare
app.use((err, req, res, next) => {
  console.error('Error encountered:', err);
  
  // Ensure statusCode is a valid HTTP status code
  const statusCode = err.statusCode && err.statusCode >= 100 && err.statusCode < 600 
    ? err.statusCode 
    : 500;
  
  // Ensure we have a meaningful message
  const message = err.message || "Internal Server Error!";
  
  // Make sure we always send a JSON response
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    // Include stack trace in development but not in production
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Static file serving - moved to the end
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, "/client/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
  });
}

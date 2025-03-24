import User from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import { errorHandler } from "../utils/error.js";
import jwt from "jsonwebtoken";

export const signup = async (req, res, next) => {
  try {
    const { username, email, password, role, phone, address, city, state, country, zipCode } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
      return next(errorHandler(400, "Username, email, and password are required"));
    }
    
    // Check if required address fields are provided
    if (!phone || !address || !city || !state || !country || !zipCode) {
      return next(errorHandler(400, "Phone, address, city, state, country, and zipCode are required"));
    }
    
    const hashedPassword = bcryptjs.hashSync(password, 10);
    
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: role || "tenant",
      phone,
      address,
      city,
      state,
      country,
      zipCode
    });

    await newUser.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Error during signup:", error);
    // Provide more specific validation error messages
    if (error.name === 'ValidationError') {
      const errorMessage = Object.values(error.errors)
        .map(err => err.message)
        .join(', ');
      return next(errorHandler(400, `Validation error: ${errorMessage}`));
    }
    next(error);
  }
};

export const signin = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return next(errorHandler(400, "Email and password are required"));
    }

    const validUser = await User.findOne({ email });
    if (!validUser) return next(errorHandler(404, "User Not Found"));

    const validPassword = bcryptjs.compareSync(password, validUser.password);
    if (!validPassword)
      return next(errorHandler(401, "Invalid User Credentials!"));

    // Check if JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined in environment variables");
      return next(errorHandler(500, "Server configuration error"));
    }

    const token = jwt.sign({ id: validUser._id }, process.env.JWT_SECRET);
    const { password: pass, ...rest } = validUser._doc;
    
    // Log the user data being sent to client
    console.log('User data being sent to client:', rest);
    
    res
      .cookie("access_token", token, { httpOnly: true })
      .status(200)
      .json(rest);
  } catch (error) {
    console.error("Error during signin:", error);
    next(errorHandler(500, "An error occurred during sign in"));
  }
};

// OAUTH CONTROLLER FUNCTION
export const google = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      const { password: pass, ...rest } = user._doc;
      res
        .cookie("access_token", token, { httpOnly: true })
        .status(200)
        .json(rest);
    } else {
      const generatePassword =
        Math.random().toString(36).slice(-8) +
        Math.random().toString(36).slice(-8);
      const hashedPassword = bcryptjs.hashSync(generatePassword, 10);
      
      // Create new user with required fields
      const newUser = new User({
        username:
          req.body.name.split(" ").join("").toLowerCase() +
          Math.random().toString(36).slice(-4),
        email: req.body.email,
        password: hashedPassword,
        profilePicture: req.body.photo || "",
        // Add required fields with default values
        phone: "Please update", // Default placeholder
        address: "Please update", // Default placeholder
        city: "Please update", // Default placeholder
        state: "Please update", // Default placeholder
        country: "Please update", // Default placeholder
        zipCode: "00000" // Default placeholder
      });

      try {
        await newUser.save();
        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);
        const { password: pass, ...rest } = newUser._doc;
        res
          .cookie("access_token", token, { httpOnly: true })
          .status(200)
          .json(rest);
      } catch (validationError) {
        console.error("User validation error:", validationError);
        return next(errorHandler(400, `Validation error: ${validationError.message}`));
      }
    }
  } catch (error) {
    console.error("Google OAuth error:", error);
    next(error);
  }
};

export const signout = async (req, res, next) => {
  try {
    res.clearCookie("access_token");
    res.status(200).json({ message: "User signed out successfully" });
  } catch (error) {
    next(error);
  }
};

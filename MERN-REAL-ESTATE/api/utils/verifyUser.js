import { errorHandler } from "./error.js";
import jwt from "jsonwebtoken";
import User from '../models/user.model.js';

export const verifyToken = async (req, res, next) => {
  const token = req.cookies.access_token;

  if (!token) {
    return next(errorHandler(401, "Unauthorized"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return next(errorHandler(404, "User not found"));
    }
    
    req.user = user;
    next();
  } catch (err) {
    return next(errorHandler(403, "Forbidden"));
  }
};

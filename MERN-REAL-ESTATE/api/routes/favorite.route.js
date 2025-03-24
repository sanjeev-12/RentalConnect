import express from "express";
import { addFavorite, removeFavorite, addSavedProperty, removeSavedProperty } from "../controllers/favorite.controller.js";

const router = express.Router();

// Favorites routes
router.post("/favorites/:listingId", addFavorite);
router.delete("/favorites/:listingId", removeFavorite);

// Saved Properties routes
router.post("/saved/:listingId", addSavedProperty);
router.delete("/saved/:listingId", removeSavedProperty);

export default router;

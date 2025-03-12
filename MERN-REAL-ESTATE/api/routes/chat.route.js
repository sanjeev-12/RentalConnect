import express from "express";
import { sendMessage, getMessages, getReceivedMessages } from "../controllers/chat.controller.js";

const router = express.Router();

router.post("/send", sendMessage);
router.get("/:userId", getMessages);
router.get("/received", getReceivedMessages);

export default router;

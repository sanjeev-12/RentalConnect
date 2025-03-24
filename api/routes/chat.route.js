import express from "express";
import { sendMessage, getMessages, getReceivedMessages, getConversations } from "../controllers/chat.controller.js";
import { verifyToken } from "../utils/verifyUser.js";

const router = express.Router();

router.post("/send", verifyToken, sendMessage);
router.get("/conversations/:userId", verifyToken, getConversations);
router.get("/:userId", verifyToken, getMessages);
router.get("/received", verifyToken, getReceivedMessages);

export default router;

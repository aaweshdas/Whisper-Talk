import { Router } from "express";
import { protectRoute } from "../middleware/auth";
import {
  getChats,
  getOrCreateChat,
  createChat,
  togglePinChat,
  toggleArchiveChat,
  toggleMuteChat,
} from "../controllers/chatController";

const router = Router();

router.use(protectRoute);

router.get("/", getChats);
router.post("/", createChat);
router.get("/:participantId", getOrCreateChat);
router.patch("/:chatId/pin", togglePinChat);
router.patch("/:chatId/archive", toggleArchiveChat);
router.patch("/:chatId/mute", toggleMuteChat);

export default router;

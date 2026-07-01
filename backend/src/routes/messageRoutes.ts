import { Router } from "express";
import { protectRoute } from "../middleware/auth";
import {
  getMessages,
  reactToMessage,
  editMessage,
  deleteMessage,
  markAsRead,
  searchMessages,
  forwardMessage,
} from "../controllers/messageController";

const router = Router();

router.use(protectRoute);

router.get("/:chatId", getMessages);
router.get("/:chatId/search", searchMessages);
router.post("/:chatId/read", markAsRead);
router.post("/:messageId/react", reactToMessage);
router.post("/:messageId/forward", forwardMessage);
router.patch("/:messageId", editMessage);
router.delete("/:messageId", deleteMessage);

export default router;

import { Router } from "express";
import { protectRoute } from "../middleware/auth";
import {
  getMessages,
  sendMessage,
  reactToMessage,
  editMessage,
  deleteMessage,
  markAsRead,
  searchMessages,
  forwardMessage,
  sendAttachment,
} from "../controllers/messageController";
import { upload } from "../utils/upload";

const router = Router();

router.use(protectRoute);

router.get("/:chatId", getMessages);
router.post("/:chatId", sendMessage);
router.post("/:chatId/attachment", upload.single("attachment"), sendAttachment);
router.get("/:chatId/search", searchMessages);
router.post("/:chatId/read", markAsRead);
router.post("/:messageId/react", reactToMessage);
router.post("/:messageId/forward", forwardMessage);
router.patch("/:messageId", editMessage);
router.delete("/:messageId", deleteMessage);

export default router;

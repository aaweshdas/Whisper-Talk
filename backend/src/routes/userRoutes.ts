import { Router } from "express";
import { protectRoute } from "../middleware/auth";
import { getUsers, searchUsers, updateUserProfile } from "../controllers/userController";
import { upload } from "../utils/upload";

const router = Router();

router.get("/", protectRoute, getUsers);
router.get("/search", protectRoute, searchUsers);
router.put("/profile", protectRoute, upload.single("avatar"), updateUserProfile);

export default router;

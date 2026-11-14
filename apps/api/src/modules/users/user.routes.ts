import { Router } from "express";
import multer from "multer";
import { userController } from "./user.controller";
import { authenticate } from "../../middleware/auth";
import { BadRequestError } from "../../utils/errors";

export const userRouter = Router();

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (allowedMimes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new BadRequestError("Invalid file type. Only JPEG, PNG, and WebP images are accepted."));
    }
  }
});

// All user profile endpoints require authentication
userRouter.use(authenticate);

userRouter.get("/me", userController.getMe.bind(userController));
userRouter.put("/me", userController.updateMe.bind(userController));
userRouter.post("/me/avatar", upload.single("avatar"), userController.uploadAvatar.bind(userController));
userRouter.delete("/me/avatar", userController.removeAvatar.bind(userController));

// Email change verification routes
userRouter.post("/me/email-change/request", userController.requestEmailChange.bind(userController));
userRouter.post("/me/email-change/verify", userController.verifyEmailChange.bind(userController));

// Google account linking / unlinking
userRouter.post("/me/google/link", userController.linkGoogle.bind(userController));
userRouter.post("/me/google/unlink", userController.unlinkGoogle.bind(userController));

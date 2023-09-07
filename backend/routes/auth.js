import express from "express";
import { body } from "express-validator";

import User from "../modals/user.js";
import { authController } from "../controllers/auth.js";


const router = express.Router();

router.put(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .custom(async (value, { req }) => {
        const user = await User.findOne({ email: value });
        if (user) {
          const error = new Error("Email address already exists");
          throw new Error("Email address already exists");
        }
      })
      .normalizeEmail(),
    body("password").trim().isLength({ min: 5 }),
    body("name").trim().not().isEmpty(),
  ],
  authController
);

router.post("/login", authController);

export { router as authRoutes };

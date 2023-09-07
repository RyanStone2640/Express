import express from "express";
import { body } from "express-validator";

import { feedController } from "../controllers/feed.js";
import { isAuthHandler } from "../middleware/is-auth.js";

const router = express.Router();

router.get("/posts", isAuthHandler, feedController);

router.post(
  "/post",
  isAuthHandler,
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],
  feedController
);

router.get("/post/:postId", isAuthHandler, feedController);

router.put(
  "/post/:postId",
  isAuthHandler,
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],
  feedController
);

router.delete("/post/:postId", isAuthHandler, feedController);

export { router as feedRoutes };

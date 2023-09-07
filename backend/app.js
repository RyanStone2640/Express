import path from "path";
import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import dotenv from "dotenv"
import helmet from 'helmet';

import { feedRoutes } from "./routes/feed.js";
import { authRoutes } from "./routes/auth.js";

dotenv.config()

const app = express();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `${new Date().toISOString().replaceAll(":", "-")}-${file.originalname}`
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(helmet());

app.use(express.static(path.resolve("public")));

app.use(express.json());
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use("/images", express.static(path.resolve("images")));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  next();
});

app.use("/feed", feedRoutes);
app.use("/auth", authRoutes);

app.get("/*", (req, res, next) => {
  return res.sendFile(path.resolve("public", "index.html"));
});

app.use((error, req, res, next) => {
  console.log(error);
  const statusCode = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  return res.status(statusCode).json({ message, data });
});

const iniTServer = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URL
    );
    app.listen(8080);
  } catch (e) {
    console.log(e);
  }
};

iniTServer();

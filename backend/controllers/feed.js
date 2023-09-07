import fs from "fs";
import path from "path";
import { validationResult } from "express-validator";

import Post from "../modals/post.js";
import User from "../modals/user.js";

const clearImgHandler = (route) => {
  const filePath = path.resolve(route);
  fs.unlink(filePath, (err) => console.log(err));
};

const getPosts = async (req, res, next) => {
  try {
    const currentPage = req.query.page || 1;
    const perPage = 2;

    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find()
      .skip((currentPage - 1) * perPage)
      .limit(perPage)
      .populate("creator", "name");

    return res.status(200).json({
      message: "Fetched posts successfully.",
      posts,
      totalItems,
    });
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
};

const createPost = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("validation failed entered data is incorrect");
      error.statusCode = 422;
      throw error;
    }

    if (!req.file) {
      const error = new Error("No image provided");
      error.statusCode = 422;
      throw error;
    }
    const imageUrl = req.file.path.replaceAll("\\", "/");
    const { title, content } = req.body;
    const post = new Post({
      title: title,
      imageUrl: imageUrl,
      content: content,
      creator: req.userId,
    });

    const result = await post.save();
    let user = await User.findById(req.userId);
    user.posts.push(result);
    user = await user.save();

    return res.status(201).json({
      message: "successfully send",
      creator: { _id: user._id, name: user.name },
    });
  } catch (e) {
    if (!e?.statusCode) {
      e.status = 500;
    }
    next(e);
  }
};

const getPost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);

    if (!post) {
      const error = new Error("Could not find post.");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ message: "Post fetched.", post: post });
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
};

const updatePost = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("validation failed entered data is incorrect");
      error.statusCode = 422;
      throw error;
    }

    let imageUrl = req.body.image;

    if (req.file) {
      imageUrl = req.file.path.replaceAll("\\", "/");
    }
    if (!imageUrl) {
      const error = new Error("No file picked");
      error.statusCode = 422;
      throw error;
    }

    const { postId } = req.params;
    const post = await Post.findById(postId);

    if (!post) {
      const error = new Error("Could not find post.");
      error.statusCode = 404;
      throw error;
    }

    if (post.creator.toString() !== req.userId) {
      const error = new Error("Not Authorization.");
      error.statusCode = 403;
      throw error;
    }

    if (imageUrl !== post.imageUrl) {
      clearImgHandler(post.imageUrl);
    }

    const { title, content } = req.body;
    post.title = title;
    post.content = content;
    post.imageUrl = imageUrl;

    const result = await post.save();

    res.status(200).json({ message: "Post updated.", post: result });
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);

    if (!post) {
      const error = new Error("Could not find post.");
      error.statusCode = 404;
      throw error;
    }

    if (post.creator.toString() !== req.userId) {
      const error = new Error("Not Authorization.");
      error.statusCode = 403;
      throw error;
    }
    let user = await User.findById(req.userId);
    user.posts.pull(postId);
    user = await user.save();
    
    const result = await Post.findByIdAndRemove(postId);
    clearImgHandler(post.imageUrl);

    res.status(200).json({ message: "Post deleted." });
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
};

const methodType = {
  GET: getPosts,
  POST: createPost,
  GETOne: getPost,
  PUT: updatePost,
  DELETE: deletePost,
};

export const feedController = (req, res, next) => {
  let { method } = req;
  if (req?.params?.postId && method === "GET") {
    method = "GETOne";
  }

  methodType[method](req, res, next);
};

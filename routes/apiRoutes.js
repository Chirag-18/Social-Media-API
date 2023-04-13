const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/authMiddleware");
const User = require("../models/UserModel");
const Post = require("../models/PostModel");
const Comment = require("../models/CommentModel");

// Authenticate user and generate JWT token
router.post("/authenticate", (req, res) => {
  const { email, password } = req.body;
  // Dummy authentication for demo purpose only
  if (email === "dummy@example.com" && password === "password") {
    const token = jwt.sign({ email }, process.env.JWT_SECRET);
    res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// Follow a user
router.post("/follow/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const follower = await User.findById(req.userId);
    const following = await User.findById(id);
    if (!following) {
      return res.status(404).json({ error: "User not found" });
    }
    if (follower.following.includes(id)) {
      return res.status(400).json({ error: "Already following this user" });
    }
    await User.findByIdAndUpdate(req.userId, { $push: { following: id } });
    await User.findByIdAndUpdate(id, { $push: { followers: req.userId } });
    res.json({ message: "User followed successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Unfollow a user
router.post("/unfollow/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const follower = await User.findById(req.userId);
    const following = await User.findById(id);
    if (!following) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!follower.following.includes(id)) {
      return res.status(400).json({ error: "Not following this user" });
    }
    await User.findByIdAndUpdate(req.userId, { $pull: { following: id } });
    await User.findByIdAndUpdate(id, { $pull: { followers: req.userId } });
    res.json({ message: "User unfollowed successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Get user profile
router.get("/user", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const numFollowers = user.followers.length;
    const numFollowing = user.following.length;
    res.json({ name: user.name, numFollowers, numFollowing });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Add a new post
router.post("/posts", authMiddleware, async (req, res) => {
  const { title, desc } = req.body;
  try {
    const post = new Post({
      title,
      desc,
      createdBy: req.userId,
    });
    await post.save();
    res.json({ postId: post._id, title, desc, createdAt: post.createdAt });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Delete a post
router.delete("/posts/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });
    if (!post) {
      return res.status(404).json({ msg: "Post not found or unauthorized" });
    }
    res.json({ msg: "Post deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Like a post
router.post("/like/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Check if the post has already been liked by this user
    if (post.likes.some((like) => like.user.toString() === req.userId)) {
      return res.status(400).json({ msg: "Post already liked" });
    }

    post.likes.unshift({ user: req.userId });
    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Unlike a post
router.post("/unlike/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Check if the post has not yet been liked by this user
    if (!post.likes.some((like) => like.user.toString() === req.userId)) {
      return res.status(400).json({ msg: "Post not yet liked" });
    }

    // remove the like
    post.likes = post.likes.filter(
      (like) => like.user.toString() !== req.userId
    );
    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Get a single post with its comments and likes
router.get("/posts/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("user", ["name"])
      .populate({
        path: "comments",
        populate: {
          path: "user",
          select: "name",
        },
      });

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    res.json(post);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Get all posts created by the authenticated user
router.get("/all_posts", authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find({ user: req.userId })
      .populate("user", ["name"])
      .populate("comments")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.post("/comment/:id", authMiddleware, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.userId;
  const { comment } = req.body;

  try {
    // check if the post with the given id exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // create new comment and save it to the database
    const newComment = new Comment({
      user: userId,
      post: postId,
      text: comment,
    });
    await newComment.save();

    // add comment to the post's comments array and save it to the database
    post.comments.push(newComment._id);
    await post.save();

    // return the comment id
    res.json({ commentId: newComment._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

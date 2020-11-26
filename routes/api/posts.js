const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auth = require("../../middleware/auth");

const Post = require("../../models/Post");
const Profile = require("../../models/Profile");
const User = require("../../models/User");

// @route   GET api/posts
// @desc    Get all posts
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    return res.send(await Post.find().sort("-date"));
  } catch (err) {
    console.error(err);
    res.send("Server Error");
  }
});

// @route   GET api/posts/:id
// @desc    Get post by ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).send({ msg: "Post not found" });

    res.send(post);
  } catch (err) {
    console.error(err);

    if (err.kind === "ObjectId")
      return res.status(404).send({ msg: "Post not found" });

    res.send("Server Error");
  }
});

// @route   POST api/posts
// @desc    Create a post
// @access  Private
router.post(
  "/",
  [auth, check("text", "Text is required").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = User.findById(req.user.id).select("-password");

      const post = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });

      res.send(await post.save());
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  }
);

// @route   DELETE api/posts/:id
// @desc    Delete post by ID
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).send({ msg: "Post not found" });

    if (req.user.id !== post.user.toHexString())
      return res.status(401).send({ msg: "Not authorized" });

    res.send(await post.remove());
  } catch (err) {
    console.error(err);

    if (err.kind === "ObjectId")
      return res.status(404).send({ msg: "Post not found" });

    res.send("Server Error");
  }
});

module.exports = router;

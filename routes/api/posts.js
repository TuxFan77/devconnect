const express = require("express");
const router = express.Router();
const { check, validationResult, body } = require("express-validator");
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
      const user = await User.findById(req.user.id).select("-password");

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

// @route   PUT api/posts/like/:id
// @desc    Like post by ID
// @access  Private
router.put("/like/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).send({ msg: "Post not found" });

    const liked = post.likes.filter(
      like => like.user.toHexString() === req.user.id
    );

    if (liked.length > 0)
      return res.status(400).send({ msg: "Post already liked" });

    post.likes.unshift({ user: req.user.id });

    await post.save();

    res.send(post.likes);
  } catch (err) {
    console.error(err);

    if (err.kind === "ObjectId")
      return res.status(404).send({ msg: "Post not found" });

    res.send("Server Error");
  }
});

// @route   PUT api/posts/unlike/:id
// @desc    Unlike post by ID
// @access  Private
router.put("/unlike/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).send({ msg: "Post not found" });

    const likeIndex = post.likes.findIndex(
      like => like.user.toHexString() === req.user.id
    );

    if (likeIndex === -1)
      return res.status(400).send({ msg: "Post has not been liked" });

    post.likes.splice(likeIndex, 1);

    await post.save();

    res.send(post.likes);
  } catch (err) {
    console.error(err);

    if (err.kind === "ObjectId")
      return res.status(404).send({ msg: "Post not found" });

    res.send("Server Error");
  }
});

// @route   POST api/posts/comment/:id
// @desc    Comment on a post
// @access  Private
router.post(
  "/comment/:id",
  [auth, check("text", "Text is required").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const [user, post] = await Promise.all([
        User.findById(req.user.id).select("-password"),
        Post.findById(req.params.id),
      ]);

      if (!post) return res.status(404).send({ msg: "Post not found" });

      const comment = {
        user: req.user.id,
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
      };

      post.comments.unshift(comment);

      await post.save();

      res.send(post.comments);
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  }
);

// @route   DELETE api/posts/comment/:post_id/:comment_id
// @desc    Delete a comment on a post
// @access  Private
router.delete("/comment/:post_id/:comment_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    const comment = post.comments.find(
      comment => comment.id === req.params.comment_id
    );

    if (!comment)
      return res.status(404).send({ msg: "Comment does not exist" });

    if (req.user.id !== comment.user.toHexString())
      return res.status(401).send({ msg: "Not authorized" });

    const commentIndex = post.comments.findIndex(
      comment => comment.id === req.params.comment_id
    );

    post.comments.splice(commentIndex, 1);

    await post.save();

    res.send(post.comments);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;

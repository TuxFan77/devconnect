const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auth = require("../../middleware/auth");

// @route   POST api/posts
// @desc    Create a post
// @access  Private
router.get("/", (req, res) => res.send("Posts route"));

module.exports = router;

const express = require("express");
const router = express.Router();
const path = require("path");

router.get("^/$|/index(.html)?", (req, res) => {
  // If the request is just / or /index or /index.html
  res.sendFile(path.join(__dirname, "..", "views", "index.html"));
});

module.exports = router;

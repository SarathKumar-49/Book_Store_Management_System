const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const db = require("../db");

/* -------- ADMIN SIGNUP -------- */
router.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.json({ success: false, message: "All fields required" });

  const hashedPassword = await bcrypt.hash(password, 10);

  const sql = "INSERT INTO admin (username, password) VALUES (?, ?)";
  db.query(sql, [username, hashedPassword], err => {
    if (err)
      return res.json({ success: false, message: "Admin already exists" });

    res.json({ success: true, message: "Signup successful" });
  });
});

/* -------- ADMIN LOGIN -------- */
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const sql = "SELECT * FROM admin WHERE username=?";
  db.query(sql, [username], async (err, results) => {
    if (err) return res.json({ success: false });

    if (results.length === 0) {
      return res.json({ success: false });
    }

    const isMatch = await bcrypt.compare(password, results[0].password);

    if (!isMatch) {
      return res.json({ success: false });
    }

    res.json({ success: true });
  });
});

module.exports = router;

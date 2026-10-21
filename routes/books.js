const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");

const upload = multer({ dest: "uploads/" });

/* SEARCH */
router.get("/search", (req, res) => {
  const { keyword } = req.query;
  if (!keyword) return res.status(400).json({ message: "Keyword required" });

  const sql = "SELECT * FROM books WHERE title LIKE ? OR author LIKE ?";
  const value = `%${keyword}%`;

  db.query(sql, [value, value], (err, results) => {
    if (err) return res.status(500).json({ message: "Database Error" });
    res.json(results);
  });
});

/* ADD */
router.post("/add", (req, res) => {
  const { title, author } = req.body;

  if (!title || !author) {
    return res.status(400).json({ message: "All fields required" });
  }

  const sql = `
    INSERT INTO books (title, author, published_date)
    VALUES (?, ?, NOW())
  `;

  db.query(sql, [title, author], (err) => {
    if (err) {
      console.error("MYSQL ERROR:", err);

      // DUPLICATE BOOK HANDLING
      if (err.errno === 1062 || err.code === "ER_DUP_ENTRY") {
        return res
          .status(409)
          .json({ message: "This book already exists" });
      }

      return res
        .status(500)
        .json({ message: "Database Error" });
    }

    res.json({ message: "Book added successfully" });
  });
});


/* CSV UPLOAD */
router.post("/upload", upload.single("csvFile"), (req, res) => {
  console.log("FILE:", req.file);

  if (!req.file) {
    return res.status(400).json({ message: "No file received" });
  }

  const filePath = req.file.path;
  const books = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => {
      console.log("ROW:", row); // 🔴 IMPORTANT
      if (row.title && row.author) {
        books.push([
          row.title.trim(),
          row.author.trim(),
          new Date()
        ]);
      }
    })
    .on("end", () => {
      fs.unlinkSync(filePath);

      console.log("BOOKS ARRAY:", books);

      if (books.length === 0) {
        return res.status(400).json({ message: "No valid rows found" });
      }

      const sql = `
        INSERT INTO books (title, author, published_date)
        VALUES ?
        ON DUPLICATE KEY UPDATE id=id
      `;

      db.query(sql, [books], (err) => {
        if (err) {
          console.error("MYSQL CSV ERROR:", err);
          return res.status(500).json({ message: "CSV upload failed" });
        }

        res.json({ message: "CSV uploaded successfully" });
      });
    });
});


/* LIST */
router.get("/list", (req, res) => {
  db.query("SELECT * FROM books ORDER BY id ASC", (err, results) => {
    if (err) return res.status(500).json({ message: "Database Error" });
    res.json(results);
  });
});

/* UPDATE */
router.put("/update/:id", (req, res) => {
  const { title, author } = req.body;

  db.query(
    "UPDATE books SET title=?, author=? WHERE id=?",
    [title, author, req.params.id],
    err => {
      if (err) return res.status(500).json({ message: "Database Error" });
      res.json({ message: "Book updated successfully" });
    }
  );
});

/* DELETE */
router.delete("/delete/:id", (req, res) => {
  db.query("DELETE FROM books WHERE id=?", [req.params.id], err => {
    if (err) return res.status(500).json({ message: "Database Error" });
    res.json({ message: "Book deleted successfully" });
  });
});

module.exports = router;

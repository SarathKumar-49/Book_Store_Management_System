const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve frontend
app.use(express.static(path.join(__dirname, "public")));

// routes
app.use("/books", require("./routes/books"));
app.use("/admin", require("./routes/admin"));

// test route
app.get("/test", (req, res) => {
  res.json({ message: "Server working" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open your project here 👉 http://localhost:${PORT}`);
});

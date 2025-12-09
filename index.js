const express = require("express");
const path = require("path");

const app = express();

// serve /public folder
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🌐 TEST SERVER STARTED on port " + PORT);
});

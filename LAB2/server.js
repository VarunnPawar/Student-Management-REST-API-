
import express from "express";
import cors from "cors";
import morgan from "morgan";
import multer from "multer";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 5000;

// ES module directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cookieParser());

// Serve uploaded files
app.use("/uploads", express.static(uploadDir));

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

// Home route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend server is running",
  });
});

// Test API route
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "API is working successfully",
  });
});

// Cookie example
app.get("/api/set-cookie", (req, res) => {
  res.cookie("userToken", "example-token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    message: "Cookie set successfully",
  });
});

// Read cookie
app.get("/api/get-cookie", (req, res) => {
  res.json({
    success: true,
    cookies: req.cookies,
  });
});

// File upload
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Please select a file",
    });
  }

  res.status(201).json({
    success: true,
    message: "File uploaded successfully",
    file: {
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`,
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: err.code === "LIMIT_FILE_SIZE"
        ? "File size must not exceed 5 MB"
        : err.message,
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.status ? err.message : "Internal server error",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
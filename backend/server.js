// backend/server.js
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import fetch from "node-fetch";
import multer from "multer";
import path from "path";
import fs from "fs";

import User from "./models/User.js";
import Student from "./models/Student.js"; // ✅ Student model

dotenv.config();
const app = express();

// ---------- Middleware ----------
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL, // e.g. "http://localhost:5173"
    credentials: true,
  })
);

// ---------- MongoDB ----------
mongoose
  .connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME || undefined })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// ---------- Uploads folder ----------
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// ---------- Multer ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ---------- Auth middleware ----------
function authMiddleware(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { email, username, rollNumber, picture }
    next();
  } catch {
    return res.status(403).json({ message: "Invalid token" });
  }
}

// ---------- Google Auth ----------
app.post("/api/auth/google", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: "Missing credential" });

    const googleRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
    );
    const googleUser = await googleRes.json();

    if (!googleUser?.email) {
      return res.status(400).json({ message: "Invalid Google token" });
    }

    if (!googleUser.email.endsWith("@svrec.ac.in")) {
      return res.status(403).json({ message: "Use your svrec.ac.in email" });
    }

    const rollNumber = googleUser.email.split("@")[0];
    const now = new Date();

    // upsert user and track logins
    let user = await User.findOne({ email: googleUser.email });
    if (user) {
      user.previousLogin = user.presentLogin || now;
      user.presentLogin = now;
      user.username = googleUser.name || user.username;
      user.rollNumber = rollNumber;
      await user.save();
    } else {
      user = await User.create({
        email: googleUser.email,
        username: googleUser.name || rollNumber,
        rollNumber,
        presentLogin: now,
        previousLogin: null,
      });
    }

    const token = jwt.sign(
      {
        email: user.email,
        username: user.username,
        rollNumber: user.rollNumber,
        picture: user.picture || "",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // set true if https
    });

    return res.json({
      user: {
        email: user.email,
        name: user.username,
        rollNumber: user.rollNumber,
        presentLogin: user.presentLogin,
        previousLogin: user.previousLogin,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Google auth failed" });
  }
});

// ---------- Auth Me ----------
app.get("/api/auth/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).lean();
    const student = await Student.findOne({ email: req.user.email }).lean();

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      email: user.email,
      name: user.username,
      rollNumber: user.rollNumber,
      presentLogin: user.presentLogin,
      previousLogin: user.previousLogin,
      department: student?.department || "",
      batch: student?.batch || "",
      bloodGroup: student?.bloodGroup || "",
      portfolio: student?.portfolio || "",
      percentage: student?.percentage || null,
      skills: student?.skills || [],
      photoPath: student?.photoPath || "",
    });
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

// ---------- Student Profile submit ----------
app.post("/api/students", authMiddleware, upload.single("photo"), async (req, res) => {
  try {
    const email = req.user.email;
    const {
      name,
      rno,
      dept,
      batch,
      bloodGroup,
      portfolio,
      percentage,
      skills,
    } = req.body;

    const skillsArray = typeof skills === "string" ? JSON.parse(skills) : [];

    const update = {
      email,
      name,
      rollNumber: rno,
      department: dept || "",
      batch: batch || "",
      bloodGroup: bloodGroup || "",
      portfolio: portfolio || "",
      percentage: percentage ? Number(percentage) : undefined,
      skills: skillsArray,
    };

    if (req.file) {
      update.photoPath = req.file.path.replace(/\\/g, "/");
    }

    const student = await Student.findOneAndUpdate(
      { email },
      { $set: update },
      { new: true, upsert: true }
    );

    res.status(201).json({ message: "Student profile saved successfully", student });
  } catch (err) {
    console.error("Error saving student:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------- Public Students Listing (with filtering) ----------
app.get("/api/students", async (req, res) => {
  try {
    let { department, year, skills, percentage, rollNumber, page = 1, limit = 25 } = req.query;

    const q = {};

    if (department) q.department = department;
    if (percentage) q.percentage = { $gte: Number(percentage) };
    if (rollNumber) q.rollNumber = { $regex: rollNumber, $options: "i" };

    // ✅ Updated skills filter (case-insensitive)
    if (skills) {
      const skillArray = skills.split(",").map((s) => s.trim());
      q.skills = { $all: skillArray.map((s) => new RegExp(`^${s}$`, "i")) };
    }

    const skip = (Number(page) - 1) * Number(limit);

    // base query
    let studentsQuery = Student.find(q).select(
      "name email rollNumber department batch percentage portfolio skills photoPath"
    );

    // ✅ Year filter derived from batch (e.g. 2022-2026)
    if (year) {
      const currentYear = new Date().getFullYear();
      const admissionYear = currentYear - Number(year) + 1;
      studentsQuery = studentsQuery.where("batch").regex(new RegExp(`^${admissionYear}-`));
    }

    const [students, totalCount] = await Promise.all([
      studentsQuery.skip(skip).limit(Number(limit)),
      Student.countDocuments(q),
    ]);

    // Add computed year field from batch
    const currentYear = new Date().getFullYear();
    const studentsWithYear = students.map((s) => {
      let studyYear = null;
      if (s.batch?.includes("-")) {
        const admissionYear = Number(s.batch.split("-")[0]);
        if (!isNaN(admissionYear)) {
          studyYear = currentYear - admissionYear + 1;
          if (studyYear < 1 || studyYear > 4) studyYear = null;
        }
      }
      return { ...s.toObject(), year: studyYear };
    });

    res.json({
      students: studentsWithYear,
      totalPages: Math.ceil(totalCount / Number(limit)) || 1,
      currentPage: Number(page),
    });
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ message: "Error fetching students" });
  }
});

// ---------- Static for uploads ----------
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ---------- Start ----------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

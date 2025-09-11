
// backend/models/Student.js
import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
  rollNumber: { type: String, required: true, unique: true },
  name: String,
  department: String,
  batch: String,
  bloodGroup: String,
  portfolio: String,
  percentage: Number,
  skills: [String],
  photoPath: String,
});

// ✅ Export correctly
export default mongoose.model("Student", studentSchema);

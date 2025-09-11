// backend/models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true },  
    rollNumber: { type: String },               
    presentLogin: { type: Date },
    previousLogin: { type: Date },
  },
  
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;

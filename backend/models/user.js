import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    invitations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group"
      }
    ],
    // 🔥 NEW: Store Notifications
    notifications: [
      {
        message: { type: String, required: true },
        isRead: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
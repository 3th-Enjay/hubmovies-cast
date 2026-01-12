import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema(
  {
    sessionToken: { type: String, unique: true, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    expires: { type: Date, required: true },
  },
  { timestamps: true }
);

// Performance indexes
// Note: sessionToken index is automatically created by unique: true
SessionSchema.index({ userId: 1 });
SessionSchema.index({ expires: 1 });

export default mongoose.models.Session || mongoose.model("Session", SessionSchema);

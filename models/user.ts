import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true },
    passwordHash: { type: String },
    role: {
      type: String,
      enum: ["TALENT", "DIRECTOR", "ADMIN"],
      required: true,
    },
    emailVerified: { type: Date },
    name: { type: String },
    image: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    // Profile completion (for talents)
    profileCompletion: { type: Number, default: 0, min: 0, max: 100 },
    // Verification tier (for talents)
    verificationTier: {
      type: String,
      enum: ["BASIC", "COMPLETE", "VERIFIED", "FEATURED"],
      default: "BASIC",
      index: true,
    },
    // Trust score (for directors)
    trustScore: { type: Number, default: 0, min: 0, max: 100 },
    // Talent profile fields
    phone: { type: String },
    bio: { type: String },
    primaryRole: { type: String },
    skills: [{ type: String }],
    experience: [{ type: String }],
    portfolio: [{ type: String }], // Array of media URLs
    // Admin restrictions
    frozen: { type: Boolean, default: false, index: true }, // Account frozen (talent/director)
    shadowLimited: { type: Boolean, default: false }, // Reduced visibility (talent)
    messagingDisabled: { type: Boolean, default: false }, // Messaging disabled (director)
    postingFrozen: { type: Boolean, default: false }, // Job posting frozen (director)
    highRisk: { type: Boolean, default: false, index: true }, // High risk flag (internal, director)
    // Restriction metadata
    restrictionReason: { type: String }, // Reason for restriction
    restrictionExpiresAt: { type: Date }, // When restriction expires (null = indefinite)
    restrictedBy: { type: String }, // Admin ID who applied restriction
  },
  { timestamps: true }
);

// Performance indexes
// Note: email index is automatically created by unique: true
UserSchema.index({ role: 1 });

export default mongoose.models.User || mongoose.model("User", UserSchema);



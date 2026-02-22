import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true, index: true },
    passwordHash: { type: String },
    role: {
      type: String,
      enum: ["TALENT", "DIRECTOR", "ADMIN"],
      required: true,
      index: true,
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
    cv: { type: String }, // CV / resume URL
    idCardFront: { type: String }, // Government ID front image URL (required for talent unlock)
    idCardBack: { type: String }, // Government ID back image URL (required for talent unlock)
    // Location (talent)
    locationCity: { type: String },
    locationState: { type: String },
    locationCountry: { type: String },
    locationAddress1: { type: String },
    locationAddress2: { type: String },
    locationPostalCode: { type: String },
    // Payment tracking (talent)
    paymentConfirmed: { type: Boolean, default: false, index: true },
    paymentMethod: { type: String },
    paymentReference: { type: String },
    paymentCardType: { type: String },
    paymentCardImageUrl: { type: String },
    paymentCardNumber: { type: String },
    paymentAt: { type: Date },
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

export default mongoose.models.User || mongoose.model("User", UserSchema);



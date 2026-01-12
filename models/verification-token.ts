import mongoose from "mongoose";

const VerificationTokenSchema = new mongoose.Schema(
  {
    identifier: { type: String, required: true },
    token: { type: String, unique: true, required: true },
    expires: { type: Date, required: true },
  },
  { timestamps: true }
);

// Compound index for identifier + token lookups
VerificationTokenSchema.index({ identifier: 1, token: 1 });
VerificationTokenSchema.index({ expires: 1 });

export default mongoose.models.VerificationToken ||
  mongoose.model("VerificationToken", VerificationTokenSchema);




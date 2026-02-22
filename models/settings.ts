import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    ethAddress: { type: String, default: null },
    btcAddress: { type: String, default: null },
    ethPrice: { type: Number, default: null }, // Amount in USD for ETH payment
    btcPrice: { type: Number, default: null }, // Amount in USD for BTC payment
    registrationPrice: { type: Number, default: 300 }, // Default $300 registration fee
    applePayDetails: { type: String, default: null }, // Recipient/details for Apple Pay
    giftCardOptions: { type: [String], default: ["APPLE", "RAZER_GOLD", "STEAM"] }, // Allowed gift card types
    updatedBy: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);

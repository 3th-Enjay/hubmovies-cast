import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Settings from "@/models/settings";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "TALENT") {
      return NextResponse.json({ error: "Forbidden. Talent access required." }, { status: 403 });
    }

    await connectDB();
    const settings = await Settings.findOne({ key: "payment" });
    const safeSettings = settings
      ? {
          ethAddress: settings.ethAddress || null,
          btcAddress: settings.btcAddress || null,
          registrationPrice: settings.registrationPrice || 300,
          applePayDetails: settings.applePayDetails || null,
          giftCardOptions:
            Array.isArray(settings.giftCardOptions) && settings.giftCardOptions.length > 0
              ? settings.giftCardOptions
              : ["APPLE", "RAZER_GOLD", "STEAM"],
        }
      : null;

    return NextResponse.json({ success: true, settings: safeSettings });
  } catch (err) {
    console.error("Failed to fetch talent payment settings:", err);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

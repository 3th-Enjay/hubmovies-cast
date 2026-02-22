import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/admin-helpers";
import Settings from "@/models/settings";

export async function GET() {
  try {
    await connectDB();
    const settings = await Settings.findOne({ key: "payment" });
    return NextResponse.json({ success: true, settings: settings || null });
  } catch (err: any) {
    console.error("Failed to fetch payment settings:", err);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const {
      ethAddress,
      btcAddress,
      ethPrice,
      btcPrice,
      registrationPrice,
      applePayDetails,
      giftCardOptions,
    } = body;

    await connectDB();
    const updateData: any = {
      ethAddress: ethAddress || null,
      btcAddress: btcAddress || null,
      applePayDetails: applePayDetails || null,
      updatedBy: admin._id.toString(),
    };

    // Only update prices if they are provided and valid
    if (ethPrice !== undefined && ethPrice !== null) {
      updateData.ethPrice = ethPrice > 0 ? ethPrice : null;
    }
    if (btcPrice !== undefined && btcPrice !== null) {
      updateData.btcPrice = btcPrice > 0 ? btcPrice : null;
    }
    if (registrationPrice !== undefined && registrationPrice !== null) {
      updateData.registrationPrice = registrationPrice > 0 ? registrationPrice : 300;
    }
    if (giftCardOptions !== undefined) {
      const normalizedOptions = Array.isArray(giftCardOptions)
        ? giftCardOptions
            .map((option: any) => String(option || "").trim().toUpperCase())
            .filter(Boolean)
        : [];
      updateData.giftCardOptions =
        normalizedOptions.length > 0
          ? Array.from(new Set(normalizedOptions))
          : ["APPLE", "RAZER_GOLD", "STEAM"];
    }

    const updated = await Settings.findOneAndUpdate(
      { key: "payment" },
      { $set: updateData },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }
    console.error("Failed to update payment settings:", err);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

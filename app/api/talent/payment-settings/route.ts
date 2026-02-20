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

    return NextResponse.json({ success: true, settings: settings || null });
  } catch (err) {
    console.error("Failed to fetch talent payment settings:", err);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

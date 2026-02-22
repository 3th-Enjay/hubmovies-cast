import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import AuditLog from "@/models/audit-log";
import { requireAdmin } from "@/lib/admin-helpers";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { method, reference, reason } = body; // method: "ETH" | "BTC" | "APPLE_PAY" | "GIFT_CARD"

    if (!method || !["ETH", "BTC", "APPLE_PAY", "GIFT_CARD"].includes(method)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const beforeState = {
      frozen: user.frozen,
      paymentConfirmed: user.paymentConfirmed,
      paymentMethod: user.paymentMethod,
      paymentReference: user.paymentReference,
    };

    user.paymentConfirmed = true;
    user.paymentMethod = method;
    user.paymentReference = reference || null;
    user.paymentAt = new Date();

    // Unlock user when payment is confirmed
    user.frozen = false;
    user.restrictionReason = null;
    user.restrictionExpiresAt = null;
    user.restrictedBy = null;

    await user.save();

    await AuditLog.create({
      actorId: admin._id.toString(),
      actorRole: "ADMIN",
      targetUserId: id,
      targetUserRole: user.role as "TALENT" | "DIRECTOR",
      actionType: "OTHER",
      beforeState,
      afterState: {
        frozen: user.frozen,
        paymentConfirmed: user.paymentConfirmed,
        paymentMethod: user.paymentMethod,
        paymentReference: user.paymentReference,
      },
      reason: reason ? reason.trim() : "Payment confirmed by admin",
      metadata: { paymentMethod: method, paymentReference: reference || null },
    });

    return NextResponse.json({ success: true, user: { _id: id, paymentConfirmed: true, frozen: false } });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }
    console.error("Failed to confirm payment:", err);
    return NextResponse.json({ error: "Failed to confirm payment" }, { status: 500 });
  }
}

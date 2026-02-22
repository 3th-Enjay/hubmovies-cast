import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import AuditLog from "@/models/audit-log";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { sendGiftCardSubmissionEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { paymentMethod, paymentReference, cardType, cardImageUrl, cardNumber } = body;

    if (!paymentMethod || !["ETH", "BTC", "APPLE_PAY", "GIFT_CARD"].includes(paymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    }

    if (!paymentReference || !paymentReference.trim()) {
      return NextResponse.json({ error: "Payment reference is required" }, { status: 400 });
    }

    if (paymentMethod === "GIFT_CARD") {
      if (!cardType || !["APPLE", "RAZER_GOLD", "STEAM"].includes(String(cardType).toUpperCase())) {
        return NextResponse.json({ error: "Invalid gift card type" }, { status: 400 });
      }
      if (!cardImageUrl || !String(cardImageUrl).trim()) {
        return NextResponse.json({ error: "Gift card image is required" }, { status: 400 });
      }
      if (!cardNumber || !String(cardNumber).trim()) {
        return NextResponse.json({ error: "Gift card number is required" }, { status: 400 });
      }
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "TALENT") {
      return NextResponse.json({ error: "Only talents can submit payments" }, { status: 403 });
    }

    // Record payment submission (not confirmed yet)
    const beforeState = {
      paymentConfirmed: user.paymentConfirmed,
      paymentMethod: user.paymentMethod,
      paymentReference: user.paymentReference,
      paymentCardType: user.paymentCardType,
      paymentCardImageUrl: user.paymentCardImageUrl,
      paymentCardNumber: user.paymentCardNumber,
      frozen: user.frozen,
    };

    user.paymentMethod = paymentMethod;
    user.paymentReference = paymentReference.trim();
    user.paymentCardType = paymentMethod === "GIFT_CARD" ? String(cardType).toUpperCase() : null;
    user.paymentCardImageUrl = paymentMethod === "GIFT_CARD" ? String(cardImageUrl).trim() : null;
    user.paymentCardNumber = paymentMethod === "GIFT_CARD" ? String(cardNumber).trim() : null;
    // Keep frozen = true until admin confirms payment
    // paymentConfirmed stays false until admin verifies

    await user.save();

    if (paymentMethod === "GIFT_CARD") {
      const adminEmails = Array.from(
        new Set(
          (process.env.ADMIN_ACCOUNTS || "")
            .split(",")
            .map((email) => email.trim())
            .filter(Boolean)
        )
      );

      if (adminEmails.length > 0) {
        Promise.allSettled(
          adminEmails.map((adminEmail) =>
            sendGiftCardSubmissionEmail(adminEmail, {
              talentEmail: user.email || "",
              talentName: user.name || undefined,
              cardType: String(cardType).toUpperCase(),
              cardNumber: String(cardNumber).trim(),
              cardImageUrl: String(cardImageUrl).trim(),
            })
          )
        ).catch((emailErr) => {
          console.error("Failed to send gift card submission emails:", emailErr);
        });
      }
    }

    // Create audit log for payment submission
    await AuditLog.create({
      actorId: userId,
      actorRole: "SYSTEM",
      targetUserId: userId,
      targetUserRole: "TALENT",
      actionType: "OTHER",
      beforeState,
      afterState: {
        paymentMethod: user.paymentMethod,
        paymentReference: user.paymentReference,
        paymentCardType: user.paymentCardType,
        paymentCardImageUrl: user.paymentCardImageUrl,
        frozen: user.frozen,
      },
      reason: `Talent submitted ${paymentMethod} payment for profile registration`,
      metadata: {
        paymentMethod,
        paymentReference: paymentReference.trim(),
        cardType: user.paymentCardType || null,
        cardImageUrl: user.paymentCardImageUrl || null,
        cardNumber: user.paymentCardNumber || null,
        submittedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment submitted. An admin will verify and unlock your account shortly.",
    });
  } catch (err: any) {
    console.error("Failed to submit payment:", err);
    return NextResponse.json(
      { error: "Failed to submit payment. Please try again." },
      { status: 500 }
    );
  }
}

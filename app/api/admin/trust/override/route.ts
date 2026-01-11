import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import AuditLog from "@/models/audit-log";
import { requireAdmin } from "@/lib/admin-helpers";
import { getTrustLevel } from "@/lib/director-trust";

/**
 * POST /api/admin/trust/override
 * Apply admin trust override (tier change, restrictions, flags)
 * 
 * Request body:
 * - targetUserId: string (required)
 * - actionType: "TRUST_TIER_CHANGE" | "RESTRICTION_APPLIED" | "FLAG_ADDED" | etc.
 * - beforeState: object (required)
 * - afterState: object (required)
 * - reason: string (required)
 * - metadata?: object (optional)
 * 
 * Returns:
 * - 200: { success: true, user }
 * - 400: Invalid request
 * - 401: Unauthorized
 * - 403: Forbidden (not admin)
 * - 404: User not found
 */
export async function POST(req: Request) {
  try {
    // Require admin authentication
    const admin = await requireAdmin();
    const body = await req.json();
    const {
      targetUserId,
      actionType,
      beforeState,
      afterState,
      reason,
      metadata = {},
    } = body;

    // Validate required fields
    if (!targetUserId || !actionType || !beforeState || !afterState || !reason) {
      return NextResponse.json(
        { error: "Missing required fields: targetUserId, actionType, beforeState, afterState, reason" },
        { status: 400 }
      );
    }

    if (!reason.trim()) {
      return NextResponse.json(
        { error: "Reason is required and cannot be empty" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find target user
    const user = await User.findById(targetUserId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Apply changes based on action type
    if (actionType === "VERIFICATION_TIER_CHANGE" || actionType === "TRUST_TIER_CHANGE") {
      if (user.role === "TALENT" && afterState.verificationTier) {
        user.verificationTier = afterState.verificationTier;
      } else if (user.role === "DIRECTOR" && afterState.trustLevel) {
        // For directors, trust level is derived from trust score
        // Map trust level to approximate score range
        const levelToScore: { [key: string]: number } = {
          "NEW_DIRECTOR": 25,
          "TRUSTED_DIRECTOR": 60,
          "VERIFIED_STUDIO": 90,
        };
        const targetScore = levelToScore[afterState.trustLevel] || user.trustScore || 0;
        user.trustScore = Math.max(0, Math.min(100, targetScore));
      }
    } else if (actionType === "TRUST_SCORE_OVERRIDE") {
      if (user.role === "DIRECTOR" && afterState.trustScore !== undefined) {
        user.trustScore = Math.max(0, Math.min(100, afterState.trustScore));
      }
    }

    // Save user changes
    await user.save();

    // Create audit log entry
    await AuditLog.create({
      actorId: admin._id.toString(),
      actorRole: "ADMIN",
      targetUserId,
      targetUserRole: user.role as "TALENT" | "DIRECTOR",
      actionType,
      beforeState,
      afterState: {
        ...afterState,
        // Include current state for reference
        verificationTier: user.verificationTier,
        trustScore: user.trustScore,
      },
      reason: reason.trim(),
      metadata,
    });

    // Fetch updated user for response
    const finalUser = await User.findById(targetUserId);
    if (!finalUser) {
      return NextResponse.json(
        { error: "User not found after update" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: finalUser._id.toString(),
        email: finalUser.email,
        name: finalUser.name,
        role: finalUser.role,
        verificationTier: finalUser.verificationTier,
        trustScore: finalUser.trustScore,
        trustLevel: finalUser.role === "DIRECTOR" ? getTrustLevel(finalUser.trustScore || 0) : null,
        frozen: finalUser.frozen,
        shadowLimited: finalUser.shadowLimited,
        messagingDisabled: finalUser.messagingDisabled,
        postingFrozen: finalUser.postingFrozen,
        highRisk: finalUser.highRisk,
      },
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }
    console.error("Failed to apply trust override:", error);
    return NextResponse.json(
      { error: "Failed to apply trust override." },
      { status: 500 }
    );
  }
}




import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import { requireAdmin } from "@/lib/admin-helpers";

/**
 * GET /api/admin/users/[id]/profile
 * View user profile (read-only, admin access)
 * For talents: includes verification data (docs, links, timestamps)
 * 
 * Returns:
 * - 200: { user, verificationData? }
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    await connectDB();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Return user profile data (read-only)
    // For talents, include verification-related fields
    const profileData: any = {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
      phone: user.phone,
      bio: user.bio,
      primaryRole: user.primaryRole,
      skills: user.skills,
      experience: user.experience,
      portfolio: user.portfolio,
      cv: user.cv,
      idCardFront: user.idCardFront,
      idCardBack: user.idCardBack,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    };

    // Add verification data for talents
    if (user.role === "TALENT") {
      profileData.verificationData = {
        verificationTier: user.verificationTier,
        profileCompletion: user.profileCompletion,
        emailVerified: user.emailVerified,
        idCardFront: user.idCardFront || null,
        idCardBack: user.idCardBack || null,
        // Note: In production, you'd include actual verification documents/links here
        // For now, we return the tier and completion status
      };
    }

    return NextResponse.json({ user: profileData });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }
    console.error("Failed to fetch user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile." },
      { status: 500 }
    );
  }
}


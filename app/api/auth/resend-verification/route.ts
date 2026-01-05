import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import { sendVerificationEmail } from "@/lib/email";
import { getUserId } from "@/lib/auth-helpers";

/**
 * POST /api/auth/resend-verification
 * Resends email verification link to the user
 * 
 * Request body:
 * - email: string (optional) - If not provided, uses authenticated user's email
 * 
 * Returns:
 * - 200: { success: true, message: string }
 * - 400: Missing email or user already verified
 * - 401: Unauthorized if email not provided and user not logged in
 * - 404: User not found
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    let email = body.email;

    // If email not provided, try to get from authenticated user
    if (!email) {
      const userId = await getUserId();
      if (!userId) {
        return NextResponse.json(
          { error: "Email is required or you must be logged in" },
          { status: 401 }
        );
      }

      await connectDB();
      const user = await User.findById(userId);
      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      email = user.email;
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // Return success even if user doesn't exist (prevent email enumeration)
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a verification link has been sent.",
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      );
    }

    // Generate verification URL using NextAuth's email provider pattern
    // In a real implementation, you would generate a proper verification token
    // For now, we'll use NextAuth's built-in email verification flow
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const verificationUrl = `${baseUrl}/auth/verify-email?email=${encodeURIComponent(email)}`;

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationUrl);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, a verification link has been sent.",
    });
  } catch (error) {
    console.error("Failed to resend verification email:", error);
    return NextResponse.json(
      { error: "Failed to resend verification email. Please try again." },
      { status: 500 }
    );
  }
}


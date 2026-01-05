import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import { getDirectorId } from "@/lib/auth-helpers";

/**
 * GET /api/director/profile
 * Fetches the director's profile information including trust score
 * 
 * Returns:
 * - 200: { profile: { trustScore: number, emailVerified: Date | null, ... } }
 * - 401: Unauthorized if user is not logged in
 * - 404: Director not found
 */
export async function GET() {
  const directorId = await getDirectorId();
  
  if (!directorId) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in." },
      { status: 401 }
    );
  }

  await connectDB();

  try {
    const director = await User.findById(directorId);
    
    if (!director) {
      return NextResponse.json(
        { error: "Director not found" },
        { status: 404 }
      );
    }

    // Return profile data
    return NextResponse.json({
      profile: {
        trustScore: director.trustScore || 0,
        emailVerified: director.emailVerified || null,
        name: director.name,
        email: director.email,
        role: director.role,
      },
    });
  } catch (error) {
    console.error("Failed to fetch director profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/notification";
import { getUserId } from "@/lib/auth-helpers";

/**
 * GET /api/notifications/unread-count
 * Returns the count of unread notifications for the authenticated user
 * 
 * Returns:
 * - 200: { count: number } - Number of unread notifications
 * - 401: Unauthorized if user is not logged in
 */
export async function GET() {
  // Get authenticated user ID
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in to view notifications." },
      { status: 401 }
    );
  }

  // Connect to MongoDB
  await connectDB();

  try {
    // Count unread notifications
    const count = await Notification.countDocuments({
      userId,
      read: false,
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Failed to fetch unread count:", error);
    return NextResponse.json(
      { error: "Failed to fetch unread count. Please try again." },
      { status: 500 }
    );
  }
}


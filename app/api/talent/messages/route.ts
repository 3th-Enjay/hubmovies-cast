import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Message from "@/models/message";
import { requireVerifiedUser } from "@/lib/auth-helpers";

/**
 * GET /api/talent/messages
 * Fetches messages for the authenticated talent
 * 
 * Query parameters:
 * - applicationId: string (optional) - Filter by specific application
 * - jobId: string (optional) - Filter by specific job
 * 
 * Returns:
 * - 200: { messages: Message[] } - List of messages
 * - 401: Unauthorized if user is not logged in
 * - 403: Email verification required
 */
export async function GET(req: Request) {
  // Require verified user (defense-in-depth)
  let userId: string;
  try {
    const user = await requireVerifiedUser();
    userId = user.id;
  } catch (error: any) {
    if (error.message === "EMAIL_NOT_VERIFIED") {
      return NextResponse.json(
        { error: "Email verification required." },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Unauthorized. Please log in to view messages." },
      { status: 401 }
    );
  }

  // Get query parameters
  const { searchParams } = new URL(req.url);
  const applicationId = searchParams.get("applicationId");
  const jobId = searchParams.get("jobId");

  // Connect to MongoDB
  await connectDB();

  try {
    // Build query - talent can see messages where they are the talent
    const query: any = {
      talentId: userId,
    };

    // Add filters if provided
    if (applicationId) {
      query.applicationId = applicationId;
    }
    if (jobId) {
      query.jobId = jobId;
    }

    // Fetch messages, sorted by creation date (oldest first for conversation view)
    const messages = await Message.find(query).sort({ createdAt: 1 });

    // Format messages for response
    const formattedMessages = messages.map((msg) => ({
      _id: msg._id.toString(),
      applicationId: msg.applicationId,
      jobId: msg.jobId,
      directorId: msg.directorId,
      talentId: msg.talentId,
      senderId: msg.senderId,
      senderRole: msg.senderRole,
      message: msg.message,
      deliveryMethod: msg.deliveryMethod,
      sent: msg.sent,
      sentAt: msg.sentAt.toISOString(),
      createdAt: msg.createdAt.toISOString(),
    }));

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages. Please try again." },
      { status: 500 }
    );
  }
}


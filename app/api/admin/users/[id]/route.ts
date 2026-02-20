import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/admin-helpers";
import User from "@/models/user";
import Job from "@/models/job";
import Application from "@/models/application";
import Message from "@/models/message";
import Notification from "@/models/notification";
import AuditLog from "@/models/audit-log";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const reason = searchParams.get("reason")?.trim() || "Admin deleted user";

    await connectDB();
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user._id.toString() === admin._id.toString()) {
      return NextResponse.json({ error: "You cannot delete your own admin account." }, { status: 400 });
    }

    const beforeState = {
      email: user.email,
      role: user.role,
      frozen: !!user.frozen,
    };

    const userId = user._id.toString();

    if (user.role === "DIRECTOR") {
      const directorJobs = await Job.find({ directorId: userId }).select("_id");
      const directorJobIds = directorJobs.map((j) => j._id.toString());

      if (directorJobIds.length > 0) {
        await Application.deleteMany({ jobId: { $in: directorJobIds } });
        await Message.deleteMany({ jobId: { $in: directorJobIds } });
        await Notification.deleteMany({ entityId: { $in: directorJobIds } });
      }

      await Job.deleteMany({ directorId: userId });
      await Message.deleteMany({ directorId: userId });
    }

    if (user.role === "TALENT") {
      await Application.deleteMany({ talentId: userId });
      await Message.deleteMany({ talentId: userId });
      await Message.deleteMany({ senderId: userId, senderRole: "talent" });
    }

    await Notification.deleteMany({ userId });
    await User.findByIdAndDelete(userId);

    await AuditLog.create({
      actorId: admin._id.toString(),
      actorRole: "ADMIN",
      targetUserId: userId,
      targetUserRole: user.role as any,
      actionType: "OTHER",
      beforeState,
      afterState: { deleted: true },
      reason,
      metadata: { action: "USER_DELETED" },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }
    console.error("Failed to delete user:", error);
    return NextResponse.json({ error: "Failed to delete user." }, { status: 500 });
  }
}

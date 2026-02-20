import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/admin-helpers";
import Job from "@/models/job";
import AuditLog from "@/models/audit-log";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const reason = body?.reason?.trim?.() || "Admin approved director job";

    await connectDB();
    const job = await Job.findById(id);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const beforeState = {
      approvedByAdmin: !!job.approvedByAdmin,
      approvedAt: job.approvedAt || null,
      status: job.status,
      hidden: !!job.hidden,
    };

    job.approvedByAdmin = true;
    job.approvedAt = new Date();
    job.approvedBy = admin._id.toString();
    job.adminActionBy = admin._id.toString();
    job.adminActionReason = reason;
    await job.save();

    await AuditLog.create({
      actorId: admin._id.toString(),
      actorRole: "ADMIN",
      targetJobId: id,
      actionType: "OTHER",
      beforeState,
      afterState: {
        approvedByAdmin: !!job.approvedByAdmin,
        approvedAt: job.approvedAt,
      },
      reason,
      metadata: { action: "JOB_APPROVED" },
    });

    return NextResponse.json({
      success: true,
      job: {
        _id: job._id.toString(),
        approvedByAdmin: !!job.approvedByAdmin,
        approvedAt: job.approvedAt,
      },
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }
    console.error("Failed to approve job:", error);
    return NextResponse.json({ error: "Failed to approve job." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/admin-helpers";
import Job from "@/models/job";
import Application from "@/models/application";
import Message from "@/models/message";
import Notification from "@/models/notification";
import AuditLog from "@/models/audit-log";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const {
      title,
      type,
      location,
      budget,
      deadline,
      description,
      status,
      approve,
      reason,
    } = body || {};

    await connectDB();
    const job = await Job.findById(id);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const beforeState = {
      title: job.title,
      type: job.type,
      location: job.location,
      budget: job.budget,
      deadline: job.deadline,
      description: job.description,
      status: job.status,
      approvedByAdmin: !!job.approvedByAdmin,
    };

    if (title !== undefined) job.title = title;
    if (type !== undefined) job.type = type;
    if (location !== undefined) job.location = location;
    if (budget !== undefined) job.budget = budget;
    if (deadline !== undefined) job.deadline = deadline;
    if (description !== undefined) job.description = description;
    if (status !== undefined) {
      if (!["open", "closed"].includes(status)) {
        return NextResponse.json(
          { error: "Invalid status. Must be 'open' or 'closed'." },
          { status: 400 }
        );
      }
      job.status = status;
    }

    if (approve === true) {
      job.approvedByAdmin = true;
      job.approvedAt = new Date();
      job.approvedBy = admin._id.toString();
    }

    job.adminActionBy = admin._id.toString();
    job.adminActionReason = reason?.trim?.() || "Admin edited job";

    await job.save();

    await AuditLog.create({
      actorId: admin._id.toString(),
      actorRole: "ADMIN",
      targetJobId: id,
      actionType: "OTHER",
      beforeState,
      afterState: {
        title: job.title,
        type: job.type,
        location: job.location,
        budget: job.budget,
        deadline: job.deadline,
        description: job.description,
        status: job.status,
        approvedByAdmin: !!job.approvedByAdmin,
      },
      reason: reason?.trim?.() || "Admin edited job",
      metadata: { action: approve ? "JOB_APPROVED_AND_EDITED" : "JOB_EDITED" },
    });

    return NextResponse.json({
      success: true,
      job: {
        _id: job._id.toString(),
        title: job.title,
        type: job.type,
        location: job.location,
        budget: job.budget,
        deadline: job.deadline,
        description: job.description,
        status: job.status,
        hidden: !!job.hidden,
        approvedByAdmin: !!job.approvedByAdmin,
      },
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }
    console.error("Failed to update admin job:", error);
    return NextResponse.json({ error: "Failed to update job." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const reason = searchParams.get("reason")?.trim() || "Admin deleted job";

    await connectDB();
    const job = await Job.findById(id);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const beforeState = {
      title: job.title,
      status: job.status,
      hidden: !!job.hidden,
      approvedByAdmin: !!job.approvedByAdmin,
    };

    await Application.deleteMany({ jobId: id });
    await Message.deleteMany({ jobId: id });
    await Notification.deleteMany({ entityId: id });
    await Job.findByIdAndDelete(id);

    await AuditLog.create({
      actorId: admin._id.toString(),
      actorRole: "ADMIN",
      targetJobId: id,
      actionType: "OTHER",
      beforeState,
      afterState: { deleted: true },
      reason,
      metadata: { action: "JOB_DELETED" },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }
    console.error("Failed to delete job:", error);
    return NextResponse.json({ error: "Failed to delete job." }, { status: 500 });
  }
}

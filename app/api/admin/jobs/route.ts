import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Job from "@/models/job";
import Application from "@/models/application";
import { requireAdmin } from "@/lib/admin-helpers";

/**
 * GET /api/admin/jobs
 * Get all jobs (including hidden ones) for admin review
 * 
 * Query parameters:
 * - directorId?: string - Filter by director
 * - status?: string - Filter by status
 * - hidden?: boolean - Filter by hidden status
 * 
 * Returns:
 * - 200: { jobs: Job[] }
 */
export async function GET(req: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const directorId = searchParams.get("directorId");
    const status = searchParams.get("status");
    const hidden = searchParams.get("hidden");

    await connectDB();

    const query: any = {};
    if (directorId) query.directorId = directorId;
    if (status) query.status = status;
    if (hidden !== null) query.hidden = hidden === "true";

    const jobs = await Job.find(query).sort({ createdAt: -1 }).limit(100);

    // Get application counts for each job
    const jobsWithCounts = await Promise.all(
      jobs.map(async (job) => {
        const applicationCount = await Application.countDocuments({ jobId: job._id.toString() });
        return {
          _id: job._id.toString(),
          directorId: job.directorId,
          title: job.title,
          type: job.type,
          location: job.location,
          budget: job.budget,
          deadline: job.deadline,
          description: job.description,
          status: job.status,
          hidden: job.hidden,
          closedEarly: job.closedEarly,
          adminActionReason: job.adminActionReason,
          approvedByAdmin: !!job.approvedByAdmin,
          approvedAt: job.approvedAt,
          applicationCount,
          createdAt: job.createdAt,
        };
      })
    );

    return NextResponse.json({ jobs: jobsWithCounts });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }
    console.error("Failed to fetch jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs." },
      { status: 500 }
    );
  }
}

// Allow admins to create job postings from the admin UI
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();

    const body = await req.json();
    const { title, type, location, budget, deadline, description, directorId } = body;

    if (!title || !type || !location) {
      return NextResponse.json({ error: "Missing required fields: title, type, location" }, { status: 400 });
    }

    await connectDB();

    // If directorId is provided, ensure it belongs to a director
    let finalDirectorId = directorId;
    if (finalDirectorId) {
      const User = (await import('@/models/user')).default;
      const dir = await User.findById(finalDirectorId);
      if (!dir || dir.role !== 'DIRECTOR') {
        return NextResponse.json({ error: "Invalid directorId" }, { status: 400 });
      }
    } else {
      // No director specified — assign to admin ID so it's trackable
      finalDirectorId = admin._id.toString();
    }

    const job = await (await import('@/models/job')).default.create({
      directorId: finalDirectorId,
      title,
      type,
      location,
      budget: budget || "",
      deadline: deadline || "",
      description: description || "",
      status: "open",
      adminActionBy: admin._id.toString(),
      approvedByAdmin: true,
      approvedAt: new Date(),
      approvedBy: admin._id.toString(),
    });

    return NextResponse.json({ job: { id: job._id.toString(), title: job.title, type: job.type, location: job.location, budget: job.budget, deadline: job.deadline, status: job.status, applicationCount: 0 } }, { status: 201 });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }
    console.error("Failed to create admin job:", error);
    return NextResponse.json({ error: "Failed to create job." }, { status: 500 });
  }
}



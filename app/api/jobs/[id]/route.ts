import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Job from "@/models/job";
import User from "@/models/user";
import { getTrustLevel, getDirectorCapabilities } from "@/lib/director-trust";

/**
 * GET /api/jobs/[id]
 * Fetch a single job for public sharing (open, not hidden).
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  await connectDB();

  try {
    const job = await Job.findById(id);

    if (!job || job.hidden || job.approvedByAdmin === false) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const director = await User.findById(job.directorId);
    const directorTrustScore = director?.trustScore || 0;
    const trustLevel = getTrustLevel(directorTrustScore);
    const capabilities = getDirectorCapabilities(trustLevel);

    return NextResponse.json({
      job: {
        _id: job._id.toString(),
        title: job.title,
        type: job.type,
        location: job.location,
        budget: job.budget,
        deadline: job.deadline,
        description: job.description,
        status: job.status,
        createdAt: job.createdAt.toISOString(),
        directorTrustScore,
        visibilityWeight: capabilities.visibilityWeight,
      },
    });
  } catch (error) {
    console.error("Failed to fetch job:", error);
    return NextResponse.json(
      { error: "Failed to fetch job. Please try again." },
      { status: 500 }
    );
  }
}

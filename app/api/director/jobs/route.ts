import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Job from "@/models/job";
import Application from "@/models/application";
import User from "@/models/user";
import { getDirectorId, requireVerifiedUser } from "@/lib/auth-helpers";
import { incrementDirectorTrustScore } from "@/lib/profile-completion";
import { getTrustLevel, getDirectorCapabilities } from "@/lib/director-trust";
import { sendDirectorJobApprovalRequestEmail } from "@/lib/email";

/**
 * GET /api/director/jobs
 * Fetches all jobs posted by the authenticated director
 * 
 * Returns:
 * - 200: { jobs: Job[] } - List of jobs with application counts
 * - 401: Unauthorized if user is not logged in
 */
export async function GET() {
  // Require verified user (defense-in-depth)
  try {
    await requireVerifiedUser();
  } catch (error: any) {
    if (error.message === "EMAIL_NOT_VERIFIED") {
      return NextResponse.json(
        { error: "Email verification required." },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Unauthorized. Please log in to view your jobs." },
      { status: 401 }
    );
  }

  // Get authenticated director ID
  const directorId = await getDirectorId();
  if (!directorId) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in to view your jobs." },
      { status: 401 }
    );
  }

  // Connect to MongoDB
  await connectDB();

  try {
    // Fetch all jobs for this director
    const jobs = await Job.find({ directorId }).sort({ createdAt: -1 });

    // Get application counts for each job
    const jobsWithCounts = await Promise.all(
      jobs.map(async (job) => {
        const applicationCount = await Application.countDocuments({
          jobId: job._id.toString(),
        });

        return {
          id: job._id.toString(),
          title: job.title,
          type: job.type,
          location: job.location,
          budget: job.budget,
          deadline: job.deadline,
          status: job.status,
          approvedByAdmin: !!job.approvedByAdmin,
          applicationCount,
        };
      })
    );

    return NextResponse.json({ jobs: jobsWithCounts });
  } catch (error) {
    console.error("Failed to fetch jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/director/jobs
 * Creates a new job posting
 * 
 * Request body:
 * - title: string (required)
 * - type: string (required)
 * - location: string (required)
 * - budget: string (optional)
 * - deadline: string (optional)
 * - description: string (optional)
 * 
 * Returns:
 * - 201: { job: Job } - Created job
 * - 400: Missing required fields
 * - 401: Unauthorized if user is not logged in
 */
export async function POST(req: Request) {
  // Require verified user (defense-in-depth)
  try {
    await requireVerifiedUser();
  } catch (error: any) {
    if (error.message === "EMAIL_NOT_VERIFIED") {
      return NextResponse.json(
        { error: "Email verification required." },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Unauthorized. Please log in to create jobs." },
      { status: 401 }
    );
  }

  // Get authenticated director ID
  const directorId = await getDirectorId();
  if (!directorId) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in to create jobs." },
      { status: 401 }
    );
  }

  // Parse request body
  const body = await req.json();
  const { title, type, location, budget, deadline, description } = body;

  // Validate required fields
  if (!title || !type || !location) {
    return NextResponse.json(
      { error: "Missing required fields: title, type, and location are required." },
      { status: 400 }
    );
  }

  // Connect to MongoDB
  await connectDB();

  try {
    // Get director trust level and capabilities
    const director = await User.findById(directorId);
    if (!director) {
      return NextResponse.json(
        { error: "Director not found" },
        { status: 404 }
      );
    }

    const trustScore = director.trustScore || 0;
    const trustLevel = getTrustLevel(trustScore);
    const capabilities = getDirectorCapabilities(trustLevel);

    // Enforce active job posting limits
    const activeJobsCount = await Job.countDocuments({
      directorId,
      status: "open",
    });

    if (activeJobsCount >= capabilities.maxActiveJobs) {
      return NextResponse.json(
        {
          error: "JOB_LIMIT_REACHED",
          message: `You have reached your limit of ${capabilities.maxActiveJobs} active job posting${capabilities.maxActiveJobs === 1 ? "" : "s"}. ${trustLevel === "NEW_DIRECTOR" ? "Review applicants promptly and build your trust to unlock more listings." : "Close existing jobs to create new ones."}`,
          maxActiveJobs: capabilities.maxActiveJobs,
          currentActiveJobs: activeJobsCount,
        },
        { status: 403 }
      );
    }

    // Create new job
    const job = await Job.create({
      directorId,
      title,
      type,
      location,
      budget: budget || "",
      deadline: deadline || "",
      description: description || "",
      status: "open",
      approvedByAdmin: false,
    });

    const appBaseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";
    const reviewUrl = `${appBaseUrl}/admin/jobs?approveJobId=${job._id.toString()}`;
    const envAdminEmails = (process.env.ADMIN_ACCOUNTS || "")
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);
    const dbAdmins = await User.find({ role: "ADMIN" }).select("email");
    const adminEmails = Array.from(
      new Set(
        [...envAdminEmails, ...dbAdmins.map((adminUser) => adminUser.email).filter(Boolean)] as string[]
      )
    );

    if (adminEmails.length > 0) {
      Promise.allSettled(
        adminEmails.map((adminEmail) =>
          sendDirectorJobApprovalRequestEmail(adminEmail, {
            jobId: job._id.toString(),
            title: job.title,
            directorName: director.name || undefined,
            directorEmail: director.email || undefined,
            approveUrl: reviewUrl,
          })
        )
      ).catch((error) => {
        console.error("Failed to send admin job approval emails:", error);
      });
    }

    // Update director trust score incrementally (job posted: +10)
    try {
      await incrementDirectorTrustScore(directorId, 10);
    } catch (error) {
      console.error("Failed to update director trust score:", error);
      // Don't fail the request if trust score update fails
    }

    // Return created job with application count (0 for new job)
    return NextResponse.json(
      {
        job: {
          id: job._id.toString(),
          title: job.title,
          type: job.type,
          location: job.location,
          budget: job.budget,
          deadline: job.deadline,
          status: job.status,
          approvedByAdmin: !!job.approvedByAdmin,
          applicationCount: 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create job:", error);
    return NextResponse.json(
      { error: "Failed to create job. Please try again." },
      { status: 500 }
    );
  }
}



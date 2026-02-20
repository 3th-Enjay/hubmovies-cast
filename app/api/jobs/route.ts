import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import Job from "@/models/job";
import User from "@/models/user";
import { getTrustLevel, getDirectorCapabilities } from "@/lib/director-trust";
import { MIN_PROFILE_COMPLETION } from "@/lib/constants";

/**
 * GET /api/jobs
 * Fetches all open jobs (public listing)
 * 
 * Payment Gate:
 * - If user is a TALENT and has NOT paid ($300), returns 403 Unauthorized
 * - Redirects to /auth/payment-required
 * 
 * Returns:
 * - 200: { jobs: Job[] } - List of jobs
 * - 403: { error: "Payment required" } - If talent hasn't paid
 */
export async function GET(req: Request) {
  await connectDB();

  try {
    // Check if user is authenticated and is a talent
    const session = await auth();
    if (session?.user) {
      const sessionUser = session.user as any;
      if (sessionUser.role === "TALENT") {
        const dbUser = await User.findById(sessionUser.id).select("paymentConfirmed profileCompletion");

        const paymentConfirmed = !!dbUser?.paymentConfirmed;
        const profileCompletion = dbUser?.profileCompletion ?? 0;

        if (!paymentConfirmed || profileCompletion < MIN_PROFILE_COMPLETION) {
          const needsProfile = profileCompletion < MIN_PROFILE_COMPLETION;
          const needsPayment = !paymentConfirmed;
          const reason = needsProfile ? "PROFILE_INCOMPLETE" : "PAYMENT_REQUIRED";
        return NextResponse.json(
            {
              error: reason,
              message: needsProfile
                ? `Your profile must be at least ${MIN_PROFILE_COMPLETION}% complete to access jobs.`
                : "Payment required. Please complete payment to access jobs.",
              required: MIN_PROFILE_COMPLETION,
              current: profileCompletion,
              redirect: needsPayment ? "/auth/payment-required" : "/talent/profile",
            },
          { status: 403 }
        );
      }
    }
    }

    // Fetch all open jobs, sorted by deadline (soonest first)
    const jobs = await Job.find({
      status: "open",
      hidden: { $ne: true },
      approvedByAdmin: { $ne: false },
    })
      .sort({ deadline: 1, createdAt: -1 })
      .limit(100); // Limit to prevent performance issues

    // Fetch director trust scores for all jobs
    const directorIds = [...new Set(jobs.map((job) => job.directorId))];
    const directors = await User.find({
      _id: { $in: directorIds },
      role: "DIRECTOR",
    });

    const directorTrustMap = new Map(
      directors.map((dir) => [dir._id.toString(), dir.trustScore || 0])
    );

    // Format jobs for response with director trust information and visibility weights
    const jobsWithTrust = jobs.map((job) => {
      const directorTrustScore = directorTrustMap.get(job.directorId) || 0;
      const trustLevel = getTrustLevel(directorTrustScore);
      const capabilities = getDirectorCapabilities(trustLevel);
      
      return {
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
        visibilityWeight: capabilities.visibilityWeight, // For sorting/ranking
      };
    });

    // Sort by visibility weight (higher = priority) then by deadline
    jobsWithTrust.sort((a, b) => {
      // First sort by visibility weight (descending)
      if (b.visibilityWeight !== a.visibilityWeight) {
        return b.visibilityWeight - a.visibilityWeight;
      }
      // Then by deadline (soonest first)
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

    return NextResponse.json({ jobs: jobsWithTrust });
  } catch (error) {
    console.error("Failed to fetch jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs. Please try again." },
      { status: 500 }
    );
  }
}




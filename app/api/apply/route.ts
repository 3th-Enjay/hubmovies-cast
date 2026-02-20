import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import cloudinary from "@/lib/cloudinary";
import Application from "@/models/application";
import User from "@/models/user";
import Job from "@/models/job";
import { requireVerifiedUser } from "@/lib/auth-helpers";
import { MIN_PROFILE_COMPLETION } from "@/lib/constants";

// Media validation constants
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_VIDEO_TYPES = ["video/mp4"];
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

function validateMedia(file: File): { valid: boolean; error?: string } {
  const fileType = file.type;
  const fileSize = file.size;
  const isVideo = ALLOWED_VIDEO_TYPES.includes(fileType);
  const isImage = ALLOWED_IMAGE_TYPES.includes(fileType);

  if (!isVideo && !isImage) {
    return {
      valid: false,
      error: "Invalid file type. Only MP4 videos and JPEG/PNG images are allowed.",
    };
  }

  if (isVideo && fileSize > MAX_VIDEO_SIZE) {
    return {
      valid: false,
      error: `Video file too large. Maximum size is ${MAX_VIDEO_SIZE / (1024 * 1024)}MB.`,
    };
  }

  if (isImage && fileSize > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: `Image file too large. Maximum size is ${MAX_IMAGE_SIZE / (1024 * 1024)}MB.`,
    };
  }

  return { valid: true };
}

/**
 * POST /api/apply
 * Handles job application submissions
 * 
 * Request body (FormData):
 * - jobId: string - The ID of the job being applied to
 * - answer: string - Talent's answer to the casting question
 * - media: File - Media file (MP4 video or JPEG/PNG image)
 * 
 * Returns:
 * - 200: Application submitted successfully
 * - 400: Missing fields, invalid media, or duplicate application
 * - 401: User not authenticated
 */
export async function POST(req: Request) {
  // Parse form data from request
  const formData = await req.formData();

  // Extract required fields from form data
  const jobId = formData.get("jobId") as string;
  const answer = formData.get("answer") as string;
  const media = formData.get("media") as File;

  // Validate that all required fields are present
  if (!jobId || !answer || !media) {
    return NextResponse.json(
      { error: "Missing fields" },
      { status: 400 }
    );
  }

  // Validate media file (type and size)
  // Ensures only allowed file types and sizes are accepted
  const mediaValidation = validateMedia(media);
  if (!mediaValidation.valid) {
    return NextResponse.json(
      { error: mediaValidation.error },
      { status: 400 }
    );
  }

  // Get authenticated and verified user
  // Requires email verification (defense-in-depth)
  let talentId: string;
  try {
    const user = await requireVerifiedUser();
    talentId = user.id;
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to apply." },
        { status: 401 }
      );
    }
    if (error.message === "EMAIL_NOT_VERIFIED") {
      return NextResponse.json(
        { error: "Email verification required. Please verify your email to apply." },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Unauthorized. Please log in to apply." },
      { status: 401 }
    );
  }

  // Connect to MongoDB database
  await connectDB();

  // Check if talent has paid ($300 payment gate)
  const user = await User.findById(talentId);
  if (!user) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  // Block unpaid talents from applying
  if (user.role === "TALENT" && !user.paymentConfirmed) {
    return NextResponse.json(
      { error: "Payment required. Please complete payment to apply for jobs.", redirect: "/auth/payment-required" },
      { status: 403 }
    );
  }

  // Enforce minimum profile completion
  const profileCompletion = user.profileCompletion ?? 0;
  if (profileCompletion < MIN_PROFILE_COMPLETION) {
    return NextResponse.json(
      {
        error: "PROFILE_INCOMPLETE",
        message: `Your profile must be at least ${MIN_PROFILE_COMPLETION}% complete to apply for jobs.`,
        required: MIN_PROFILE_COMPLETION,
        current: profileCompletion,
      },
      { status: 403 }
    );
  }

  // Check if talent already applied to this job
  // Prevents duplicate applications from the same user
  const targetJob = await Job.findById(jobId).select("status hidden approvedByAdmin");
  if (!targetJob || targetJob.hidden || targetJob.approvedByAdmin === false || targetJob.status !== "open") {
    return NextResponse.json(
      { error: "This job is not available for applications." },
      { status: 404 }
    );
  }

  const existing = await Application.findOne({ jobId, talentId });
  if (existing) {
    return NextResponse.json(
      { error: "You have already applied to this job" },
      { status: 400 }
    );
  }

  // Determine resource type based on file type for Cloudinary upload
  // Videos and images require different resource_type settings
  const isVideo = ALLOWED_VIDEO_TYPES.includes(media.type);
  const resourceType = isVideo ? "video" : "image";

  // Convert file to buffer for Cloudinary upload
  const buffer = Buffer.from(await media.arrayBuffer());

  // Upload media to Cloudinary
  // Uses upload_stream for efficient handling of large files
  const upload = await new Promise<any>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { resource_type: resourceType },
        (err, result) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(result);
        }
      )
      .end(buffer);
  });

  // Save application to MongoDB
  // Stores job application with talent ID, answer, and media URL
  await Application.create({
    jobId,
    talentId,
    answer,
    mediaUrl: upload.secure_url,
  });

  // Return success response
  return NextResponse.json({ success: true });
}

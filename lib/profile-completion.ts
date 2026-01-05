/**
 * Profile Completion Calculation Utility
 * 
 * Calculates talent profile completion percentage based on required and optional fields.
 * 
 * Field Weights:
 * - Profile photo: 15%
 * - Full name: 10%
 * - Email (verified): 10%
 * - Phone number: 5% (optional)
 * - Bio / About: 15%
 * - Primary role: 10%
 * - Skills / tags: 10%
 * - Experience / credits: 10% (optional)
 * - Portfolio media: 15% (optional)
 * 
 * Total: 100%
 * Minimum threshold: 70%
 */

import User from "@/models/user";

export const MIN_PROFILE_COMPLETION = 70;

export interface ProfileCompletionResult {
  score: number;
  missing: string[];
  complete: boolean;
}

/**
 * Calculate talent profile completion score
 * Returns score (0-100) and list of missing fields
 */
export function calculateTalentProfileCompletion(user: any): ProfileCompletionResult {
  let score = 0;
  const missing: string[] = [];

  // Profile photo (15%)
  if (user.image) {
    score += 15;
  } else {
    missing.push("profile photo");
  }

  // Full name (10%)
  if (user.name && user.name.trim()) {
    score += 10;
  } else {
    missing.push("full name");
  }

  // Email verified (10%)
  if (user.emailVerified) {
    score += 10;
  } else {
    missing.push("email verification");
  }

  // Phone number (5% - optional)
  if (user.phone && user.phone.trim()) {
    score += 5;
  }

  // Bio / About (15%)
  if (user.bio && user.bio.trim()) {
    score += 15;
  } else {
    missing.push("bio");
  }

  // Primary role (10%)
  if (user.primaryRole && user.primaryRole.trim()) {
    score += 10;
  } else {
    missing.push("primary role");
  }

  // Skills / tags (10%)
  if (user.skills && Array.isArray(user.skills) && user.skills.length > 0) {
    score += 10;
  } else {
    missing.push("skills");
  }

  // Experience / credits (10% - optional)
  if (user.experience && Array.isArray(user.experience) && user.experience.length > 0) {
    score += 10;
  }

  // Portfolio media (15% - optional)
  if (user.portfolio && Array.isArray(user.portfolio) && user.portfolio.length > 0) {
    score += 15;
  }

  // Ensure score doesn't exceed 100
  score = Math.min(score, 100);

  return {
    score,
    missing,
    complete: score >= MIN_PROFILE_COMPLETION,
  };
}

/**
 * Update user's profile completion score and verification tier
 * Call this whenever profile fields are updated
 * Auto-upgrades verification tier based on completion
 */
export async function updateProfileCompletion(userId: string): Promise<number> {
  const { connectDB } = await import("@/lib/mongodb");
  await connectDB();

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Only calculate for talents
  if (user.role !== "TALENT") {
    return 0;
  }

  const result = calculateTalentProfileCompletion(user);
  user.profileCompletion = result.score;

  // Auto-upgrade verification tier based on completion
  // Tier Rules:
  // BASIC: Email verified (default)
  // COMPLETE: Profile ≥ 70% + email verified
  // VERIFIED: Manual admin review (future)
  // FEATURED: Platform-curated (future)
  if (!user.emailVerified) {
    // Can't have any tier without email verification
    user.verificationTier = "BASIC";
  } else if (result.score >= MIN_PROFILE_COMPLETION) {
    // Auto-upgrade to COMPLETE when threshold met
    if (!user.verificationTier || user.verificationTier === "BASIC") {
      user.verificationTier = "COMPLETE";
    }
    // Don't downgrade VERIFIED or FEATURED (manual/admin only)
  } else {
    // Email verified but < 70% completion = BASIC
    if (!user.verificationTier || user.verificationTier === "COMPLETE") {
      user.verificationTier = "BASIC";
    }
  }

  await user.save();

  return result.score;
}

/**
 * Calculate director trust score
 * Based on: email verified, company profile, payment method, jobs completed, no abuse reports
 */
export function calculateDirectorTrustScore(user: any): number {
  let score = 0;

  // Email verified (20%)
  if (user.emailVerified) {
    score += 20;
  }

  // Company profile completed (30%) - placeholder for future company field
  // if (user.companyProfile && user.companyProfile.complete) {
  //   score += 30;
  // }

  // Payment method added (20%) - placeholder for future payment field
  // if (user.paymentMethod) {
  //   score += 20;
  // }

  // Jobs completed (20%) - placeholder for future job completion tracking
  // if (user.completedJobs && user.completedJobs.length > 0) {
  //   score += 20;
  // }

  // No abuse reports (10%) - placeholder for future moderation system
  // if (!user.abuseReports || user.abuseReports.length === 0) {
  //   score += 10;
  // }

  // For now, base score on email verification only
  // Future: Add other factors as they're implemented

  return Math.min(score, 100);
}

/**
 * Resolve talent verification tier based on profile completion and email verification
 * Returns: "BASIC" | "COMPLETE" | "VERIFIED" | "FEATURED"
 */
export function resolveTalentTier(user: any): "BASIC" | "COMPLETE" | "VERIFIED" | "FEATURED" {
  if (!user.emailVerified) {
    return "BASIC";
  }

  const completion = calculateTalentProfileCompletion(user);
  
  if (completion.score >= MIN_PROFILE_COMPLETION) {
    // Auto-upgrade to COMPLETE when threshold met
    if (!user.verificationTier || user.verificationTier === "BASIC") {
      return "COMPLETE";
    }
    // Don't downgrade VERIFIED or FEATURED (manual/admin only)
    return user.verificationTier as "COMPLETE" | "VERIFIED" | "FEATURED";
  } else {
    // Email verified but < 70% completion = BASIC
    if (!user.verificationTier || user.verificationTier === "COMPLETE") {
      return "BASIC";
    }
    // Don't downgrade VERIFIED or FEATURED
    return user.verificationTier as "BASIC" | "VERIFIED" | "FEATURED";
  }
}

/**
 * Update director trust score incrementally
 * Use this for activity-based updates (job posted, application reviewed, etc.)
 * Never calculated on the fly - adjusted by actions
 */
export async function incrementDirectorTrustScore(
  userId: string,
  points: number
): Promise<number> {
  const { connectDB } = await import("@/lib/mongodb");
  await connectDB();

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Only update for directors
  if (user.role !== "DIRECTOR") {
    return 0;
  }

  // Increment trust score (clamped to 0-100)
  const newScore = Math.max(0, Math.min(100, (user.trustScore || 0) + points));
  user.trustScore = newScore;
  await user.save();

  return newScore;
}

/**
 * Update director trust score (full recalculation)
 * Call this for initial setup or when base factors change (email verification, etc.)
 */
export async function updateDirectorTrustScore(userId: string): Promise<number> {
  const { connectDB } = await import("@/lib/mongodb");
  await connectDB();

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Only calculate for directors
  if (user.role !== "DIRECTOR") {
    return 0;
  }

  const score = calculateDirectorTrustScore(user);
  user.trustScore = score;
  await user.save();

  return score;
}


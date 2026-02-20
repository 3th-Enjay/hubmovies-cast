"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import ModalShell from "./modal-shell";
import { getTrustLevel, getTrustMessaging } from "@/lib/director-trust";

// Update Step type to include blocker step (0) and 5 steps
type Step = 0 | 1 | 2 | 3 | 4 | 5;

type ApplyFormData = {
  media: File | null;
  answer: string;
};

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

function StepZero({
  score,
  missing,
  onCompleteProfile,
}: {
  score: number;
  missing: string[];
  onCompleteProfile: () => void;
}) {
  const MIN_REQUIRED = 70;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <p className="text-white text-lg mb-2">Complete Your Profile to Apply</p>
        <p className="text-[var(--text-secondary)] text-sm">
          Your profile must be at least {MIN_REQUIRED}% complete to apply for roles.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-secondary)]">Profile Completion</span>
          <span className="text-white">{score}%</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`h-full ${
              score >= MIN_REQUIRED
                ? "bg-[var(--accent-gold)]"
                : "bg-[#8f1d18]"
            }`}
          />
        </div>
      </div>

      {/* Missing Fields Checklist */}
      {missing.length > 0 && (
        <div className="bg-white/5 p-4 rounded border border-white/10">
          <p className="text-white text-sm mb-3 font-medium">Missing Fields:</p>
          <ul className="space-y-2">
            {missing.map((field, index) => (
              <li key={index} className="text-[var(--text-secondary)] text-sm flex items-center gap-2">
                <span className="text-[#8f1d18]">✗</span>
                <span className="capitalize">{field}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={onCompleteProfile}
        className="w-full bg-[var(--accent-gold)] text-black py-3 rounded font-medium hover:opacity-90 transition"
      >
        Complete Profile
      </button>
    </motion.div>
  );
}

function StepOne({ 
  onNext, 
  directorTrustScore 
}: { 
  onNext: () => void;
  directorTrustScore?: number;
}) {
  const trustLevel = directorTrustScore !== undefined 
    ? getTrustLevel(directorTrustScore) 
    : null;
  const messaging = trustLevel ? getTrustMessaging(trustLevel) : null;
  const isNewDirector = trustLevel === "NEW_DIRECTOR";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      <p className="text-white">Confirm your profile details</p>

      <div className="bg-white/5 p-4 rounded-lg text-sm text-gray-300">
        <p>Name: John Doe</p>
        <p>Role: Actor</p>
        <p>Location: Lagos</p>
      </div>

      {/* Trust-based messaging */}
      {messaging && (
        <>
          {messaging.warning && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-yellow-400/10 border border-yellow-400/30 rounded text-sm text-yellow-200"
            >
              <p className="font-medium mb-1">Note</p>
              <p>{messaging.warning}</p>
            </motion.div>
          )}
          {trustLevel === "VERIFIED_STUDIO" && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-[var(--accent-gold)]/10 border border-[var(--accent-gold)]/30 rounded text-sm text-[var(--accent-gold)]"
            >
              <p className="font-medium mb-1">Verified Studio</p>
              <p>This is a highly trusted casting opportunity.</p>
            </motion.div>
          )}
        </>
      )}

      <button
        onClick={onNext}
        className="w-full bg-[var(--accent-gold)] text-black py-2 rounded"
      >
        Continue
      </button>
    </motion.div>
  );
}

function StepTwo({
  onNext,
  onBack,
  setMedia,
}: {
  onNext: () => void;
  onBack: () => void;
  setMedia: (file: File | null) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setError(null);

    if (!file) {
      setMedia(null);
      return;
    }

    const validation = validateMedia(file);
    if (!validation.valid) {
      setError(validation.error || "Invalid file");
      setMedia(null);
      return;
    }

    setMedia(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      <p className="text-white">Upload your media</p>

      <input
        type="file"
        accept="video/mp4,image/jpeg,image/jpg,image/png"
        onChange={handleFileChange}
        className="w-full text-sm text-white"
      />

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      <p className="text-gray-400 text-xs">
        Accepted formats: MP4 (max 50MB), JPEG/PNG (max 10MB)
      </p>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 border py-2 rounded">
          Back
        </button>
        <button
          onClick={onNext}
          className="flex-1 bg-[var(--accent-gold)] text-black py-2 rounded"
        >
          Next
        </button>
      </div>
    </motion.div>
  );
}

function StepThree({
  onNext,
  onBack,
  answer,
  setAnswer,
}: {
  onNext: () => void;
  onBack: () => void;
  answer: string;
  setAnswer: (v: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      <p className="text-white">Answer casting question</p>

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Why are you suitable for this role?"
        className="w-full bg-white/5 p-3 rounded text-white"
      />

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 border py-2 rounded">
          Back
        </button>
        <button
          onClick={onNext}
          className="flex-1 bg-[var(--accent-gold)] text-black py-2 rounded"
        >
          Review
        </button>
      </div>
    </motion.div>
  );
}

function StepFour({
  onSubmit,
  loading,
  onBack,
  answer,
  media,
}: {
  onSubmit: () => void;
  loading: boolean;
  onBack: () => void;
  answer: string;
  media: File | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      <p className="text-white text-lg">Review your application</p>
      
      <div className="bg-white/5 p-4 rounded text-sm space-y-2">
        <p className="text-gray-300">Media: {media?.name || "No file uploaded"}</p>
        <p className="text-gray-300">Answer:</p>
        <p className="text-white">{answer || "No answer provided"}</p>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 border py-2 rounded">
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={loading}
          className="flex-1 bg-[var(--accent-gold)] text-black py-2 rounded"
        >
          {loading ? "Submitting..." : "Submit Application"}
        </button>
      </div>
    </motion.div>
  );
}

function StepFive({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-4 text-center"
    >
      <p className="text-white text-lg">Application Submitted 🎉</p>

      <p className="text-gray-400 text-sm">
        Casting directors will review your application. You'll be notified if
        shortlisted.
      </p>

      <button
        onClick={onClose}
        className="w-full bg-[var(--accent-gold)] text-black py-2 rounded"
      >
        Close
      </button>
    </motion.div>
  );
}

export default function ApplyFlowModal({
  jobId,
  jobTitle,
  directorTrustScore,
  onClose,
}: {
  jobId: string;
  jobTitle: string;
  directorTrustScore?: number;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState<{
    score: number;
    missing: string[];
    complete: boolean;
  } | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const router = useRouter();
  const { data: session, status } = useSession();

  const [formData, setFormData] = useState<ApplyFormData>({
    media: null,
    answer: "",
  });

  // Check profile completion and applied status when modal opens
  useEffect(() => {
    async function checkStatus() {
      // Wait until session status is resolved
      if (status === "loading") return;

      // If unauthenticated, redirect to auth page instead of calling protected APIs
      if (!session) {
        const encodedRedirect = encodeURIComponent(`/jobs?jobId=${jobId}`);
        router.push(`/auth/password?redirect=${encodedRedirect}`);
        return;
      }

      try {
        // Check profile completion
        const profileRes = await fetch("/api/talent/profile/completion");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfileCompletion(profileData);
        }

        // Check applied status
        const res = await fetch(`/api/apply/status?jobId=${jobId}`);
        const data = await res.json();
        setHasApplied(data.applied || false);
      } catch (error) {
        // If error, assume not applied and profile incomplete
        setHasApplied(false);
      } finally {
        setCheckingStatus(false);
        setCheckingProfile(false);
      }
    }

    checkStatus();
  }, [jobId, session, status]);

  // Set initial step based on profile completion
  useEffect(() => {
    if (!checkingProfile && profileCompletion) {
      if (!profileCompletion.complete) {
        setStep(0); // Show blocker if incomplete
      } else {
        setStep(1); // Start normal flow if complete
      }
    }
  }, [checkingProfile, profileCompletion]);

  const next = () => setStep((s) => Math.min(5, (s + 1)) as Step);
  const back = () => setStep((s) => Math.max(1, (s - 1)) as Step);

  async function handleSubmit() {
    // Check if already applied before submitting
    if (hasApplied) {
      alert("You have already applied to this job. Duplicate applications are not allowed.");
      return;
    }

    // Validation
    if (!formData.media) {
      alert("Please upload a media file");
      return;
    }

    // Validate media file type and size
    const mediaValidation = validateMedia(formData.media);
    if (!mediaValidation.valid) {
      alert(mediaValidation.error || "Invalid media file");
      return;
    }

    if (!formData.answer.trim()) {
      alert("Please answer the casting question");
      return;
    }

    setLoading(true);

    const body = new FormData();
    body.append("jobId", jobId);
    body.append("answer", formData.answer);
    body.append("media", formData.media);

    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        body,
      });

      if (res.ok) {
        setHasApplied(true); // Update local state
        setStep(5); // Navigate to success step
      } else {
        const data = await res.json();
        // Check if error is due to profile incompleteness
        if (data.error === "PROFILE_INCOMPLETE") {
          // Refresh profile completion and show blocker
          const profileRes = await fetch("/api/talent/profile/completion");
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            setProfileCompletion(profileData);
            setStep(0); // Show blocker step
          }
          alert(data.message || "Your profile must be at least 70% complete to apply.");
          return;
        }
        // Check if error is due to duplicate application
        if (data.error && data.error.includes("already applied")) {
          setHasApplied(true);
          alert("You have already applied to this job. Duplicate applications are not allowed.");
        } else {
          alert(data.error || "Something went wrong. Please try again.");
        }
      }
    } catch (error) {
      alert("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  // Show message if already applied
  if (!checkingStatus && hasApplied) {
    return (
      <ModalShell onClose={onClose}>
        <div className="space-y-4 text-center">
          <p className="text-white text-lg">Already Applied</p>
          <p className="text-gray-400 text-sm">
            You have already submitted an application for this role. Duplicate applications are not allowed.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-[var(--accent-gold)] text-black py-2 rounded"
          >
            Close
          </button>
        </div>
      </ModalShell>
    );
  }

  // Show loading while checking status
  if (checkingStatus || checkingProfile) {
    return (
      <ModalShell onClose={onClose}>
        <div className="space-y-4 text-center">
          <p className="text-white text-lg">Checking application status...</p>
        </div>
      </ModalShell>
    );
  }

  // Show profile completion blocker if incomplete
  if (profileCompletion && !profileCompletion.complete) {
    return (
      <ModalShell onClose={onClose}>
        <div className="mb-6">
          <p className="text-xs tracking-[0.3em] text-[var(--accent-gold)] mb-2">
            APPLY TO ROLE
          </p>
          <h3 className="text-xl text-white">{jobTitle}</h3>
        </div>
        <StepZero
          score={profileCompletion.score}
          missing={profileCompletion.missing}
          onCompleteProfile={() => {
            onClose();
            router.push("/talent/profile");
          }}
        />
      </ModalShell>
    );
  }

  return (
    <ModalShell onClose={onClose}>
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs tracking-[0.3em] text-[var(--accent-gold)] mb-2">
          APPLY TO ROLE
        </p>
        <h3 className="text-xl text-white">{jobTitle}</h3>
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && profileCompletion && (
          <StepZero
            score={profileCompletion.score}
            missing={profileCompletion.missing}
            onCompleteProfile={() => {
              onClose();
              router.push("/talent/profile");
            }}
          />
        )}
        {step === 1 && <StepOne onNext={next} directorTrustScore={directorTrustScore} />}
        {step === 2 && (
          <StepTwo
            onNext={next}
            onBack={back}
            setMedia={(media) => setFormData((d) => ({ ...d, media }))}
          />
        )}
        {step === 3 && (
          <StepThree
            onNext={next}
            onBack={back}
            answer={formData.answer}
            setAnswer={(answer) => setFormData((d) => ({ ...d, answer }))}
          />
        )}
        {step === 4 && (
          <StepFour
            onSubmit={handleSubmit}
            loading={loading}
            onBack={back}
            answer={formData.answer}
            media={formData.media}
          />
        )}
        {step === 5 && <StepFive onClose={onClose} />}
      </AnimatePresence>
    </ModalShell>
  );
}

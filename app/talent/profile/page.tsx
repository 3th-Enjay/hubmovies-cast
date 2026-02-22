"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import TalentSidebar from "@/app/components/talent-sidebar";
import { usePaymentNavigation } from "@/lib/use-payment-navigation";

type ProfileData = {
  id: string;
  email: string;
  name?: string;
  image?: string;
  phone?: string;
  bio?: string;
  primaryRole?: string;
  skills: string[];
  experience: string[];
  portfolio: string[];
  cv?: string;
  idCardFront?: string;
  idCardBack?: string;
  locationCity?: string;
  locationState?: string;
  locationCountry?: string;
  locationAddress1?: string;
  locationAddress2?: string;
  locationPostalCode?: string;
  profileCompletion: number;
  verificationTier: string;
  paymentConfirmed: boolean;
};

export default function TalentProfilePage() {
  const router = useRouter();
  const sessionResult = useSession();
  const session = sessionResult?.data;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const idCardFrontInputRef = useRef<HTMLInputElement>(null);
  const idCardBackInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [uploadingIdCard, setUploadingIdCard] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    image: "",
    phone: "",
    bio: "",
    primaryRole: "",
    skills: [] as string[],
    experience: [] as string[],
    portfolio: [] as string[],
    cv: "",
    idCardFront: "",
    idCardBack: "",
    locationCity: "",
    locationState: "",
    locationCountry: "",
    locationAddress1: "",
    locationAddress2: "",
    locationPostalCode: "",
  });

  const [skillInput, setSkillInput] = useState("");
  const [experienceInput, setExperienceInput] = useState("");
  const { goToPayment, loading: paymentLoading } = usePaymentNavigation();

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/talent/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
          setFormData({
            name: data.profile.name || "",
            image: data.profile.image || "",
            phone: data.profile.phone || "",
            bio: data.profile.bio || "",
            primaryRole: data.profile.primaryRole || "",
            skills: data.profile.skills || [],
            experience: data.profile.experience || [],
            portfolio: data.profile.portfolio || [],
            cv: data.profile.cv || "",
            idCardFront: data.profile.idCardFront || "",
            idCardBack: data.profile.idCardBack || "",
            locationCity: data.profile.locationCity || "",
            locationState: data.profile.locationState || "",
            locationCountry: data.profile.locationCountry || "",
            locationAddress1: data.profile.locationAddress1 || "",
            locationAddress2: data.profile.locationAddress2 || "",
            locationPostalCode: data.profile.locationPostalCode || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Only JPEG/PNG images are allowed.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image file too large. Maximum size is 10MB.");
      return;
    }

    setUploadingImage(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "profile_images"); // You'll need to configure this in Cloudinary

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setFormData((prev) => ({ ...prev, image: data.url }));
      } else {
        // Fallback: try direct Cloudinary upload
        const cloudinaryFormData = new FormData();
        cloudinaryFormData.append("file", file);
        cloudinaryFormData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "default");

        const cloudinaryRes = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: "POST",
            body: cloudinaryFormData,
          }
        );

        if (cloudinaryRes.ok) {
          const cloudinaryData = await cloudinaryRes.json();
          setFormData((prev) => ({ ...prev, image: cloudinaryData.secure_url }));
        } else {
          setError("Failed to upload image. Please try again.");
        }
      }
    } catch (err) {
      setError("Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingPortfolio(true);
    setError("");

    const uploadedUrls: string[] = [];

    for (const file of files) {
      // Validate file
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "video/mp4"];
      if (!allowedTypes.includes(file.type)) {
        setError(`Invalid file type for ${file.name}. Only JPEG/PNG images and MP4 videos are allowed.`);
        continue;
      }

      const maxSize = file.type.startsWith("video/") ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setError(`File ${file.name} is too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "portfolio_media");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          uploadedUrls.push(data.url);
        } else {
          // Fallback: direct Cloudinary upload
          const cloudinaryFormData = new FormData();
          cloudinaryFormData.append("file", file);
          cloudinaryFormData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "default");

          const cloudinaryRes = await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${file.type.startsWith("video/") ? "video" : "image"}/upload`,
            {
              method: "POST",
              body: cloudinaryFormData,
            }
          );

          if (cloudinaryRes.ok) {
            const cloudinaryData = await cloudinaryRes.json();
            uploadedUrls.push(cloudinaryData.secure_url);
          }
        }
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err);
      }
    }

    if (uploadedUrls.length > 0) {
      setFormData((prev) => ({
        ...prev,
        portfolio: [...prev.portfolio, ...uploadedUrls],
      }));
    }

    setUploadingPortfolio(false);
  };

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate document types
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(file.type)) {
      setError("Invalid CV format. Please upload PDF or DOC/DOCX.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("CV file too large. Maximum size is 10MB.");
      return;
    }

    setError("");
    setUploadingPortfolio(true);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (res.ok) {
        const data = await res.json();
        setFormData((prev) => ({ ...prev, cv: data.url }));
      } else {
        setError("Failed to upload CV. Please try again.");
      }
    } catch (err) {
      console.error("Failed to upload CV:", err);
      setError("Failed to upload CV. Please try again.");
    } finally {
      setUploadingPortfolio(false);
    }
  };

  const handleIdCardUpload = async (
    side: "idCardFront" | "idCardBack",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid ID format. Please upload JPEG or PNG.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("ID image too large. Maximum size is 10MB.");
      return;
    }

    setUploadingIdCard(true);
    setError("");

    try {
      const payload = new FormData();
      payload.append("file", file);
      payload.append("upload_preset", "profile_images");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: payload,
      });

      if (!res.ok) {
        setError("Failed to upload ID image. Please try again.");
        return;
      }

      const data = await res.json();
      if (!data?.url) {
        setError("Failed to upload ID image. Please try again.");
        return;
      }

      setFormData((prev) => ({ ...prev, [side]: data.url }));
    } catch (err) {
      console.error("Failed to upload ID image:", err);
      setError("Failed to upload ID image. Please try again.");
    } finally {
      setUploadingIdCard(false);
    }
  };

  const handleRemovePortfolioItem = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      portfolio: prev.portfolio.filter((item) => item !== url),
    }));
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()],
      });
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
  };

  const handleAddExperience = () => {
    if (experienceInput.trim() && !formData.experience.includes(experienceInput.trim())) {
      setFormData({
        ...formData,
        experience: [...formData.experience, experienceInput.trim()],
      });
      setExperienceInput("");
    }
  };

  const handleRemoveExperience = (exp: string) => {
    setFormData({
      ...formData,
      experience: formData.experience.filter((e) => e !== exp),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    if (!formData.idCardFront || !formData.idCardBack) {
      setError("Means of identification is required. Upload ID front and back.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/talent/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setProfile(data.profile);
        if (data?.profile?.profileCompletion >= 70 && !data?.profile?.paymentConfirmed) {
          router.push("/auth/payment");
          return;
        }
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        setError(data.error || "Failed to update profile. Please try again.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getStatusLabel = (completion: number) => {
    if (completion >= 70) return "Complete your profile to unlock applications";
    if (completion >= 50) return "Almost there! Complete your profile to unlock applications";
    return "Complete your profile to unlock applications";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] relative flex items-center justify-center">
        <div className="text-white">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] relative">
      {/* Noise overlay */}
      <div
        className="fixed inset-0 opacity-[0.015] pointer-events-none z-0"
        style={{
          backgroundImage: "url('/noise.png')",
          backgroundRepeat: "repeat",
        }}
      />

      {/* Fixed Cinematic Header */}
      <div className="fixed top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 to-transparent z-20 pointer-events-none" />

      <TalentSidebar />

      {/* Dashboard Container */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-12 sm:pt-20 pb-24 sm:pb-12 w-full md:pl-56">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="mb-10"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading text-white mb-2">
            Edit Profile
          </h1>
          <p className="text-xs sm:text-sm font-body text-[var(--text-secondary)]">
            Complete your profile to unlock job applications
          </p>
        </motion.div>

        {/* Profile Completion Progress */}
        {profile && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 sm:p-6 bg-white/5 border border-white/10 rounded"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-white text-base font-medium font-body">Profile Completion</span>
              <span className="text-[var(--accent-gold)] text-base font-medium font-body">
                {profile.profileCompletion}%
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${profile.profileCompletion}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`h-full ${
                  profile.profileCompletion >= 70
                    ? "bg-[var(--accent-gold)]"
                    : "bg-[#8f1d18]"
                }`}
              />
            </div>
            <p className="text-sm text-[var(--text-secondary)] font-body">
              {getStatusLabel(profile.profileCompletion)}
            </p>
            {profile.verificationTier && (
              <p className="text-xs text-[var(--text-secondary)] mt-2 font-body">
                Verification Tier: <span className="text-white capitalize">{profile.verificationTier}</span>
              </p>
            )}
          </motion.div>
        )}

        {profile && profile.profileCompletion >= 70 && !profile.paymentConfirmed && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 sm:p-5 bg-[var(--accent-gold)]/10 border border-[var(--accent-gold)]/30 rounded"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-white text-sm font-medium mb-1">Profile complete â€” payment required</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  Complete payment to unlock job listings and applications.
                </p>
              </div>
              <button
                type="button"
                onClick={goToPayment}
                disabled={paymentLoading}
                className="px-4 py-2 bg-[var(--accent-gold)] text-black text-sm font-medium rounded hover:opacity-90 transition disabled:opacity-60"
              >
                {paymentLoading ? "Loading..." : "Go to Payment"}
              </button>
            </div>
          </motion.div>
        )}

        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-[var(--accent-gold)]/20 border border-[var(--accent-gold)]/30 rounded text-sm text-[var(--accent-gold)] font-body"
          >
            Profile updated successfully! Completion: {profile?.profileCompletion}%
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-white/5 border border-red-500/30 rounded text-sm text-red-400 font-body">
            {error}
          </div>
        )}

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          {/* Section 1: Profile Overview */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 sm:p-6 bg-white/5 border border-white/10 rounded"
          >
            <h2 className="text-xl font-heading text-white mb-6">Profile Overview</h2>
            
            {/* Profile Image */}
            <div className="mb-6">
              <label className="block text-sm text-[var(--text-secondary)] mb-3 font-body">
                Profile Image <span className="text-[var(--accent-gold)]">*</span>
              </label>
              <div className="flex items-center gap-4">
                {formData.image ? (
                  <div className="relative">
                    <img
                      src={formData.image}
                      alt="Profile"
                      className="w-24 h-24 rounded object-cover border border-white/10"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: "" })}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded bg-white/5 border border-white/10 flex items-center justify-center">
                    <span className="text-2xl">📷</span>
                  </div>
                )}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="px-4 py-2 bg-white/5 border border-white/10 text-white text-sm rounded hover:bg-white/10 transition disabled:opacity-50 font-body"
                  >
                    {uploadingImage ? "Uploading..." : formData.image ? "Change Image" : "Upload Image"}
                  </button>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 font-body">
                    JPEG/PNG, max 10MB
                  </p>
                </div>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2 font-body">
                Full Name <span className="text-[var(--accent-gold)]">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Your full name"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-white placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)]/50 font-body"
              />
            </div>
          </motion.div>

          {/* Section 2: About You */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 sm:p-6 bg-white/5 border border-white/10 rounded"
          >
            <h2 className="text-xl font-heading text-white mb-6">About You</h2>
            
            {/* Bio */}
            <div className="mb-4">
              <label className="block text-sm text-[var(--text-secondary)] mb-2 font-body">
                Bio / About <span className="text-[var(--accent-gold)]">*</span>
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                required
                rows={5}
                placeholder="Tell us about yourself, your experience, and what makes you unique..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-white placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)]/50 font-body resize-none"
              />
            </div>

            {/* Phone Number (Optional) */}
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2 font-body">
                Phone Number <span className="text-xs text-[var(--text-secondary)]">(optional)</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-white placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)]/50 font-body"
              />
            </div>
          </motion.div>

          {/* Section 3: Skills & Role */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-4 sm:p-6 bg-white/5 border border-white/10 rounded"
          >
            <h2 className="text-xl font-heading text-white mb-6">Skills & Role</h2>
            
            {/* Primary Role */}
            <div className="mb-6">
              <label className="block text-sm text-[var(--text-secondary)] mb-2 font-body">
                Primary Role <span className="text-[var(--accent-gold)]">*</span>
              </label>
              <select
                value={formData.primaryRole}
                onChange={(e) => setFormData({ ...formData, primaryRole: e.target.value })}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-[var(--accent-gold)]/50 font-body"
              >
                <option value="">Select your primary role</option>
                <option value="Actor">Actor</option>
                <option value="Actress">Actress</option>
                <option value="Model">Model</option>
                <option value="Voice Actor">Voice Actor</option>
                <option value="Stunt Performer">Stunt Performer</option>
                <option value="Extra">Extra</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2 font-body">
                Skills <span className="text-[var(--accent-gold)]">*</span>
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  placeholder="Add a skill (e.g., Dancing, Singing, Martial Arts)"
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded text-white placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)]/50 font-body"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-6 py-3 bg-[var(--accent-gold)] text-black font-medium rounded hover:opacity-90 transition font-body"
                >
                  Add
                </button>
              </div>
              {formData.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-white/5 border border-white/10 rounded text-sm text-white flex items-center gap-2 font-body"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-[var(--text-secondary)] hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Section 4: Portfolio */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-4 sm:p-6 bg-white/5 border border-white/10 rounded"
          >
            <h2 className="text-xl font-heading text-white mb-6">Identity Verification</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-white/5 border border-white/10 rounded">
                <label className="block text-sm text-[var(--text-secondary)] mb-2 font-body">
                  ID Card Front <span className="text-[var(--accent-gold)]">*</span>
                </label>
                {formData.idCardFront ? (
                  <div className="space-y-2">
                    <img
                      src={formData.idCardFront}
                      alt="ID card front"
                      className="w-full h-32 object-cover rounded border border-white/10"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, idCardFront: "" }))}
                      className="px-3 py-1 text-xs bg-red-600 text-white rounded"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-secondary)] mb-2">No image uploaded</p>
                )}
                <input
                  ref={idCardFrontInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={(e) => handleIdCardUpload("idCardFront", e)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => idCardFrontInputRef.current?.click()}
                  disabled={uploadingIdCard}
                  className="px-4 py-2 bg-white/5 border border-white/10 text-white text-sm rounded hover:bg-white/10 transition disabled:opacity-50 font-body"
                >
                  {uploadingIdCard ? "Uploading..." : formData.idCardFront ? "Change Front" : "Upload Front"}
                </button>
              </div>
              <div className="p-4 bg-white/5 border border-white/10 rounded">
                <label className="block text-sm text-[var(--text-secondary)] mb-2 font-body">
                  ID Card Back <span className="text-[var(--accent-gold)]">*</span>
                </label>
                {formData.idCardBack ? (
                  <div className="space-y-2">
                    <img
                      src={formData.idCardBack}
                      alt="ID card back"
                      className="w-full h-32 object-cover rounded border border-white/10"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, idCardBack: "" }))}
                      className="px-3 py-1 text-xs bg-red-600 text-white rounded"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-secondary)] mb-2">No image uploaded</p>
                )}
                <input
                  ref={idCardBackInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={(e) => handleIdCardUpload("idCardBack", e)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => idCardBackInputRef.current?.click()}
                  disabled={uploadingIdCard}
                  className="px-4 py-2 bg-white/5 border border-white/10 text-white text-sm rounded hover:bg-white/10 transition disabled:opacity-50 font-body"
                >
                  {uploadingIdCard ? "Uploading..." : formData.idCardBack ? "Change Back" : "Upload Back"}
                </button>
              </div>
            </div>

            <h2 className="text-xl font-heading text-white mb-6">Portfolio</h2>
            
            <div className="mb-4">
              <div className="mb-4">
                <label className="block text-sm text-[var(--text-secondary)] mb-2 font-body">CV / Resume <span className="text-xs text-[var(--text-secondary)]">(optional, PDF/DOC)</span></label>
                <div className="flex items-center gap-4">
                  {formData.cv ? (
                    <div className="flex items-center gap-3">
                      <a href={formData.cv} target="_blank" rel="noreferrer" className="text-[var(--accent-gold)] hover:underline">View CV</a>
                      <button type="button" onClick={() => setFormData({ ...formData, cv: "" })} className="px-2 py-1 text-xs bg-red-600 rounded text-white">Remove</button>
                    </div>
                  ) : (
                    <div className="text-sm text-[var(--text-secondary)]">No CV uploaded</div>
                  )}
                  <input ref={cvInputRef} type="file" accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleCvUpload} className="hidden" />
                  <button type="button" onClick={() => cvInputRef.current?.click()} className="px-4 py-2 bg-white/5 border border-white/10 text-white text-sm rounded hover:bg-white/10 transition">{uploadingPortfolio ? "Uploading..." : formData.cv ? "Change CV" : "Upload CV"}</button>
                </div>
              </div>
              <input
                ref={portfolioInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,video/mp4"
                multiple
                onChange={handlePortfolioUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => portfolioInputRef.current?.click()}
                disabled={uploadingPortfolio}
                className="px-4 py-2 bg-white/5 border border-white/10 text-white text-sm rounded hover:bg-white/10 transition disabled:opacity-50 font-body"
              >
                {uploadingPortfolio ? "Uploading..." : "Add Media"}
              </button>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-body">
                JPEG/PNG images (max 10MB) or MP4 videos (max 50MB)
              </p>
            </div>

            {formData.portfolio.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {formData.portfolio.map((url, index) => (
                  <div key={index} className="relative group">
                    {url.includes("video") || url.endsWith(".mp4") ? (
                      <video
                        src={url}
                        className="w-full h-32 object-cover rounded border border-white/10"
                        controls
                      />
                    ) : (
                      <img
                        src={url}
                        alt={`Portfolio ${index + 1}`}
                        className="w-full h-32 object-cover rounded border border-white/10"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemovePortfolioItem(url)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Section 5: Location */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="p-4 sm:p-6 bg-white/5 border border-white/10 rounded"
          >
            <h2 className="text-xl font-heading text-white mb-6">Location</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2 font-body">
                  City
                </label>
                <input
                  type="text"
                  value={formData.locationCity}
                  onChange={(e) => setFormData({ ...formData, locationCity: e.target.value })}
                  placeholder="City"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-white placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)]/50 font-body"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2 font-body">
                  State / Region
                </label>
                <input
                  type="text"
                  value={formData.locationState}
                  onChange={(e) => setFormData({ ...formData, locationState: e.target.value })}
                  placeholder="State or region"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-white placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)]/50 font-body"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2 font-body">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.locationCountry}
                  onChange={(e) => setFormData({ ...formData, locationCountry: e.target.value })}
                  placeholder="Country"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-white placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)]/50 font-body"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2 font-body">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={formData.locationPostalCode}
                  onChange={(e) => setFormData({ ...formData, locationPostalCode: e.target.value })}
                  placeholder="Postal code"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-white placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)]/50 font-body"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2 font-body">
                  Address Line 1
                </label>
                <input
                  type="text"
                  value={formData.locationAddress1}
                  onChange={(e) => setFormData({ ...formData, locationAddress1: e.target.value })}
                  placeholder="Street address"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-white placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)]/50 font-body"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2 font-body">
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={formData.locationAddress2}
                  onChange={(e) => setFormData({ ...formData, locationAddress2: e.target.value })}
                  placeholder="Apartment, suite, etc."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-white placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)]/50 font-body"
                />
              </div>
            </div>
          </motion.div>

          {/* Section 6: Experience */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="p-4 sm:p-6 bg-white/5 border border-white/10 rounded"
          >
            <h2 className="text-xl font-heading text-white mb-6">Experience</h2>
            
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={experienceInput}
                onChange={(e) => setExperienceInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddExperience();
                  }
                }}
                placeholder="Add a credit (e.g., Movie Title, TV Show, Commercial)"
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded text-white placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)]/50 font-body"
              />
              <button
                type="button"
                onClick={handleAddExperience}
                className="px-6 py-3 bg-white/5 border border-white/10 text-white font-medium rounded hover:bg-white/10 transition font-body"
              >
                Add
              </button>
            </div>
            {formData.experience.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.experience.map((exp, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-white/5 border border-white/10 rounded text-sm text-white flex items-center gap-2 font-body"
                  >
                    {exp}
                    <button
                      type="button"
                      onClick={() => handleRemoveExperience(exp)}
                      className="text-[var(--text-secondary)] hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </motion.div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-white/20 text-white hover:bg-white/10 transition font-body"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-[var(--accent-gold)] text-black font-medium rounded hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed font-body"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}

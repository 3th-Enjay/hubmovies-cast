"use client";

import { Suspense, useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import JobDetailModal from "@/app/components/job-detail-modal";
import { useSession } from "next-auth/react";
import TalentSidebar from "@/app/components/talent-sidebar";
import { MIN_PROFILE_COMPLETION } from "@/lib/constants";
import { usePaymentNavigation } from "@/lib/use-payment-navigation";

type Job = {
  _id: string;
  title: string;
  type: string;
  location: string;
  budget: string;
  deadline: string;
  description?: string;
  status: "open" | "closed";
  createdAt: string;
  directorTrustScore?: number;
};

type Filter = {
  type: string[];
  location: string;
  status: "all" | "open" | "closed";
};

function JobsListingContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const user = session?.user as any;
  const isTalent = user?.role === "TALENT";
  const paymentConfirmed = !!user?.paymentConfirmed;
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [accessError, setAccessError] = useState<null | { type: "PROFILE_INCOMPLETE" | "PAYMENT_REQUIRED"; message: string }>(null);
  const [paymentPending, setPaymentPending] = useState(false);
  const { goToPayment, loading: paymentLoading } = usePaymentNavigation();
  const [filters, setFilters] = useState<Filter>({
    type: [],
    location: "",
    status: "open",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 10;
  const sharedJobId = searchParams.get("jobId");

  // Fetch jobs
  useEffect(() => {
    async function fetchJobs() {
      setLoading(true);
      setAccessError(null);
      try {
        // TODO: Replace with actual API endpoint when available
        // For now, using mock data structure
        const res = await fetch("/api/jobs");
        if (res.ok) {
          const data = await res.json();
          setJobs(data.jobs || []);
        } else if (res.status === 403) {
          const data = await res.json().catch(() => ({}));
          const type = data?.error === "PROFILE_INCOMPLETE" ? "PROFILE_INCOMPLETE" : "PAYMENT_REQUIRED";
          setAccessError({
            type,
            message:
              data?.message ||
              (type === "PROFILE_INCOMPLETE"
                ? `Your profile must be at least ${MIN_PROFILE_COMPLETION}% complete to access jobs.`
                : "Payment required. Please complete payment to access jobs."),
          });
          setJobs([]);
        } else {
          // Fallback to empty array if API fails
          setJobs([]);
        }
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, []);

  const refreshPaymentPending = async () => {
    try {
      const res = await fetch("/api/talent/profile");
      if (res.ok) {
        const data = await res.json();
        setPaymentPending(!!data?.profile?.paymentPending);
      }
    } catch (error) {
      setPaymentPending(false);
    }
  };

  useEffect(() => {
    if (!isTalent || !accessError || accessError.type !== "PAYMENT_REQUIRED") {
      setPaymentPending(false);
      return;
    }

    refreshPaymentPending();
  }, [isTalent, accessError]);

  // Check applied status
  useEffect(() => {
    async function checkAppliedStatus() {
      const appliedSet = new Set<string>();
      for (const job of jobs) {
        try {
          const res = await fetch(`/api/apply/status?jobId=${job._id}`);
          const data = await res.json();
          if (data.applied) {
            appliedSet.add(job._id);
          }
        } catch (error) {
          // Silently fail
        }
      }
      setAppliedJobs(appliedSet);
    }

    if (jobs.length > 0) {
      checkAppliedStatus();
    }
  }, [jobs]);

  useEffect(() => {
    async function openSharedJob(jobId: string) {
      try {
        const res = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.job) {
          setSelectedJob(data.job);
        }
      } catch (error) {
        console.error("Failed to open shared job:", error);
      }
    }

    if (!sharedJobId) return;
    if (selectedJob?._id === sharedJobId) return;
    openSharedJob(sharedJobId);
  }, [sharedJobId, selectedJob?._id]);

  // Apply filters
  useEffect(() => {
    let filtered = [...jobs];

    // Filter by status
    if (filters.status !== "all") {
      filtered = filtered.filter((job) => job.status === filters.status);
    }

    // Filter by type
    if (filters.type.length > 0) {
      filtered = filtered.filter((job) => filters.type.includes(job.type));
    }

    // Filter by location
    if (filters.location) {
      filtered = filtered.filter((job) =>
        job.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    setFilteredJobs(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [jobs, filters]);

  const handleTypeFilter = (type: string) => {
    setFilters((prev) => ({
      ...prev,
      type: prev.type.includes(type)
        ? prev.type.filter((t) => t !== type)
        : [...prev.type, type],
    }));
  };

  const jobTypes = ["Actor", "Crew", "Model", "Voice"];
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * jobsPerPage,
    currentPage * jobsPerPage
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Closed";
    if (diffDays === 0) return "Closes today";
    if (diffDays === 1) return "Closes tomorrow";
    return `Closes in ${diffDays} days`;
  };

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

      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-24 sm:pb-12 w-full md:pl-56">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="mb-12 relative overflow-hidden rounded-lg"
        >
          {/* Background image */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{
              backgroundImage:
                "url('https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1920')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />

          {/* Content */}
          <div className="relative z-10 p-8 md:p-12">
            <p className="text-xs tracking-[0.3em] text-[var(--accent-gold)] mb-3">
              CASTING OPPORTUNITIES
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl text-white mb-3 font-heading">
              Open Casting Calls
            </h1>
            {isTalent && !paymentConfirmed && (
              <div
                title="Locked until payment is confirmed"
                className="inline-flex items-center gap-2 px-3 py-1 border border-[var(--accent-gold)]/30 text-[var(--accent-gold)] text-xs rounded"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Locked until payment is confirmed
              </div>
            )}
            <p className="text-[var(--text-secondary)] text-lg">
              Discover roles across film, television, and digital media
            </p>
          </div>
        </motion.div>

        {!accessError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
            className="mb-8 bg-[var(--bg-surface)] border border-white/10 p-6 rounded-lg"
          >
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--text-secondary)] font-body">Type:</span>
                {jobTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => handleTypeFilter(type)}
                    className={`px-3 py-1 text-xs rounded border transition font-body ${
                      filters.type.includes(type)
                        ? "bg-[var(--accent-gold)]/20 text-[var(--accent-gold)] border-[var(--accent-gold)]/30"
                        : "bg-white/5 text-[var(--text-secondary)] border-white/10 hover:border-white/20"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--text-secondary)] font-body">Status:</span>
                {(["all", "open", "closed"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilters((prev) => ({ ...prev, status }))}
                    className={`px-3 py-1 text-xs rounded border transition font-body ${
                      filters.status === status
                        ? "bg-[var(--accent-gold)]/20 text-[var(--accent-gold)] border-[var(--accent-gold)]/30"
                        : "bg-white/5 text-[var(--text-secondary)] border-white/10 hover:border-white/20"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Search location..."
                value={filters.location}
                onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))}
                className="ml-auto px-4 py-2 bg-white/5 border border-white/10 rounded text-white placeholder-[var(--text-secondary)] text-sm font-body focus:outline-none focus:border-white/20"
              />
            </div>
          </motion.div>
        )}

        {/* Jobs List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-[var(--text-secondary)] font-body">Loading jobs...</p>
          </div>
        ) : accessError ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 relative overflow-hidden rounded-lg bg-[var(--bg-surface)] border border-white/10"
          >
            <div className="relative z-10">
              <p className="text-white text-lg mb-2 font-body">Access Locked</p>
              {accessError.type === "PAYMENT_REQUIRED" && paymentPending ? (
                <div className="mb-6 flex flex-col items-center gap-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 text-xs uppercase tracking-wide border border-[var(--accent-gold)]/40 text-[var(--accent-gold)] rounded">
                    <span className="w-2 h-2 bg-[var(--accent-gold)] rounded-full" />
                    Payment submitted - pending confirmation
                  </div>
                  <button
                    onClick={refreshPaymentPending}
                    className="px-4 py-2 border border-white/20 text-white hover:border-white/40 transition font-body text-sm"
                  >
                    Refresh Status
                  </button>
                </div>
              ) : (
                <p className="text-[var(--text-secondary)] text-sm font-body mb-6">
                  {accessError.message}
                </p>
              )}
              {accessError.type === "PROFILE_INCOMPLETE" ? (
                <Link
                  href="/talent/profile"
                  className="px-6 py-2 border border-white/20 text-white hover:border-white/40 transition font-body text-sm inline-block"
                >
                  Complete Profile
                </Link>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={goToPayment}
                    disabled={paymentLoading}
                    className="px-6 py-2 bg-[var(--accent-gold)] text-black font-medium rounded hover:opacity-90 transition font-body text-sm disabled:opacity-60"
                  >
                    {paymentLoading ? "Loading..." : "Go to Payment"}
                  </button>
                  <a
                    href="mailto:creativeartistagencyn@gmail.com?subject=Payment%20Confirmation"
                    className="px-6 py-2 border border-white/20 text-white hover:border-white/40 transition font-body text-sm"
                  >
                    Contact Support
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        ) : paginatedJobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 relative overflow-hidden rounded-lg"
          >
            <div
              className="absolute inset-0 bg-cover bg-center opacity-5"
              style={{
                backgroundImage:
                  "url('https://images.pexels.com/photos/3184302/pexels-photo-3184302.jpeg?auto=compress&cs=tinysrgb&w=800')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
            <div className="relative z-10">
              <p className="text-[var(--text-secondary)] text-lg mb-2 font-body">
                No jobs found
              </p>
              <p className="text-[var(--text-secondary)] text-sm font-body">
                Try adjusting your filters
              </p>
            </div>
          </motion.div>
        ) : (
          <>
            <div className="space-y-4 mb-8">
              {paginatedJobs.map((job, index) => {
                const hasApplied = appliedJobs.has(job._id);
                const isLocked = isTalent && !paymentConfirmed;
                return (
                  <motion.div
                    key={job._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3, ease: "easeOut" }}
                    onClick={() => {
                      if (!hasApplied && !isLocked) {
                        setSelectedJob(job);
                      }
                    }}
                    className={`bg-[var(--bg-surface)] border border-white/8 rounded-xl p-6 hover:border-white/20 transition-all relative overflow-hidden group ${
                      hasApplied || isLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                    }`}
                  >
                    {/* Subtle background */}
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-5 group-hover:opacity-10 transition-opacity"
                      style={{
                        backgroundImage:
                          "url('https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800')",
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
                    {isLocked && (
                      <div className="absolute top-3 right-3 px-2 py-1 text-[10px] uppercase tracking-wide bg-black/60 border border-[var(--accent-gold)]/40 text-[var(--accent-gold)] rounded">
                        Locked
                      </div>
                    )}

                    <div className="relative z-10 flex items-start justify-between gap-6">
                      <div className="flex-1">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <h3 className="text-xl text-white group-hover:text-[var(--accent-gold)] transition font-heading">
                    {job.title}
                  </h3>
                          {hasApplied && (
                            <span className="px-3 py-1 text-xs bg-[var(--accent-gold)]/20 text-[var(--accent-gold)] border border-[var(--accent-gold)]/30 rounded font-body">
                              Applied
                            </span>
                          )}
                          {isLocked && (
                            <span
                              title="Locked until payment is confirmed"
                              className="px-3 py-1 text-xs bg-white/5 text-[var(--accent-gold)] border border-[var(--accent-gold)]/30 rounded font-body inline-flex items-center gap-2"
                            >
                              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="10" rx="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                              </svg>
                              Locked
                            </span>
                          )}
                          {isLocked && paymentPending && (
                            <span className="px-3 py-1 text-xs bg-white/5 text-[var(--text-secondary)] border border-white/10 rounded font-body">
                              Pending
                            </span>
                          )}
                  {job.directorTrustScore !== undefined && (() => {
                    // Dynamic import to avoid SSR issues
                    const { getTrustBadge } = require("@/lib/director-trust");
                    const badge = getTrustBadge(job.directorTrustScore || 0);
                    return (
                      <span
                        className={`px-2 py-1 text-xs rounded border ${badge.bgColor} ${badge.color} ${badge.borderColor} font-body`}
                      >
                        {badge.label}
                      </span>
                    );
                  })()}
                  {!isLocked && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const origin = typeof window !== "undefined" ? window.location.origin : "";
                        const shareUrl = `${origin}/jobs?jobId=${encodeURIComponent(job._id)}`;
                        navigator.clipboard.writeText(shareUrl).then(
                          () => alert("Share link copied to clipboard."),
                          () => alert(`Share link: ${shareUrl}`)
                        );
                      }}
                      className="px-2 py-1 text-xs border border-white/20 text-white rounded hover:bg-white/10 transition font-body"
                    >
                      Share
                    </button>
                  )}
                </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                          <div>
                            <p className="text-[var(--text-secondary)] mb-1 font-body">Type</p>
                            <p className="text-white font-body">{job.type}</p>
                          </div>
                          <div>
                            <p className="text-[var(--text-secondary)] mb-1 font-body">Location</p>
                            <p className="text-white font-body">{job.location}</p>
                          </div>
                          <div>
                            <p className="text-[var(--text-secondary)] mb-1 font-body">Deadline</p>
                            <p className="text-white font-body">{formatDate(job.deadline)}</p>
                          </div>
                        </div>
                        {job.budget && (
                          <p className="text-sm text-[var(--text-secondary)] font-body">
                            Budget: <span className="text-white">{job.budget}</span>
                          </p>
                        )}
                      </div>
                      {!hasApplied && (
                        <span className="text-white group-hover:translate-x-1 transition">→</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-white/40 transition font-body text-sm"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-[var(--text-secondary)] font-body text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-white/40 transition font-body text-sm"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => {
            // Capture job ID before setting to null
            const jobId = selectedJob?._id;
            setSelectedJob(null);
            if (typeof window !== "undefined") {
              const url = new URL(window.location.href);
              if (url.searchParams.has("jobId")) {
                url.searchParams.delete("jobId");
                const query = url.searchParams.toString();
                window.history.replaceState({}, "", `${url.pathname}${query ? `?${query}` : ""}${url.hash}`);
              }
            }
            // Refresh applied status
            if (jobId) {
              async function refreshStatus() {
                try {
                  const res = await fetch(`/api/apply/status?jobId=${jobId}`);
                  const data = await res.json();
                  if (data.applied) {
                    setAppliedJobs((prev) => new Set([...prev, jobId]));
                  }
                } catch (error) {
                  // Silently fail
                }
              }
              refreshStatus();
            }
          }}
        />
      )}
    </div>
  );
}

export default function JobsListingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
          <p className="text-[var(--text-secondary)]">Loading jobs...</p>
        </div>
      }
    >
      <JobsListingContent />
    </Suspense>
  );
}

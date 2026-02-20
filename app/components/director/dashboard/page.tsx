"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import DirectorStats from "./components/director-stats";
import DirectorTrustPanel from "./components/director-trust-panel";
import JobList from "./components/job-list";
import ManageApplicantsModal from "./modals/manage-applicants-modal";
import CreateJobModal from "./modals/create-job-modal";
import EditJobModal from "./modals/edit-job-modal";
import MessageModal from "./modals/message-modal";
import { getTrustLevel, getDirectorCapabilities } from "@/lib/director-trust";

type Application = {
  _id: string;
  jobId: string;
  talentId: string;
  talentName?: string;
  answer: string;
  mediaUrl: string;
  status: "submitted" | "shortlisted" | "rejected";
  createdAt: string;
};

type Job = {
  id: string;
  title: string;
  type: string;
  location: string;
  budget: string;
  deadline: string;
  status: "open" | "closed";
  applicationCount: number;
};

export default function CastingDashboard() {
  const sessionResult = useSession();
  const session = sessionResult?.data;
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [directorProfile, setDirectorProfile] = useState<{
    trustScore: number;
    emailVerified?: Date | null;
  } | null>(null);
  const [directorCapabilities, setDirectorCapabilities] = useState<{
    canBulkShortlist: boolean;
    canBulkReject: boolean;
    maxActiveJobs: number;
  } | null>(null);
  
  const emailVerified = session?.user ? ((session.user as any)?.emailVerified ?? false) : false;

  // Calculate stats across all jobs
  // For shortlisted/rejected, we calculate from currently loaded applications
  // In a full implementation, you might want to fetch aggregate counts
  const stats = {
    totalJobs: jobs.length,
    totalApplications: jobs.reduce((acc, job) => acc + job.applicationCount, 0),
    shortlisted: applications.filter((app) => app.status === "shortlisted").length,
    rejected: applications.filter((app) => app.status === "rejected").length,
  };

  // Fetch director profile (trust score)
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/director/profile");
        if (res.ok) {
          const data = await res.json();
          const trustScore = data.profile.trustScore || 0;
          const trustLevel = getTrustLevel(trustScore);
          const capabilities = getDirectorCapabilities(trustLevel);
          
          setDirectorProfile({
            trustScore,
            emailVerified: data.profile.emailVerified,
          });
          
          setDirectorCapabilities({
            canBulkShortlist: capabilities.canBulkShortlist,
            canBulkReject: capabilities.canBulkReject,
            maxActiveJobs: capabilities.maxActiveJobs,
          });
        }
      } catch (error) {
        console.error("Failed to fetch director profile:", error);
      }
    }
    fetchProfile();
  }, []);

  // Fetch jobs posted by casting director
  useEffect(() => {
    async function fetchJobs() {
      setLoading(true);
      try {
        const res = await fetch("/api/director/jobs");
        if (res.ok) {
          const data = await res.json();
          setJobs(data.jobs || []);
        } else {
          const errorData = await res.json();
          console.error("Failed to fetch jobs:", errorData.error);
          if (res.status === 401) {
            alert("Please log in to view your jobs.");
          }
        }
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
        alert("Network error. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  // Fetch applications for selected job
  useEffect(() => {
    if (!selectedJob) {
      setApplications([]);
      return;
    }

    const jobId = selectedJob.id;

    async function fetchApplications() {
      setLoadingApplications(true);
      try {
        const res = await fetch(`/api/director/applications?jobId=${jobId}`);
        if (res.ok) {
          const data = await res.json();
          setApplications(data.applications || []);
        } else {
          const errorData = await res.json();
          console.error("Failed to fetch applications:", errorData.error);
          if (res.status === 401) {
            alert("Please log in to view applications.");
          } else if (res.status === 403) {
            alert("You don't have access to this job's applications.");
          } else if (res.status === 404) {
            alert("Job not found.");
          }
        }
      } catch (error) {
        console.error("Failed to fetch applications:", error);
        alert("Network error. Please check your connection and try again.");
      } finally {
        setLoadingApplications(false);
      }
    }

    fetchApplications();
  }, [selectedJob]);

  // Handle job creation
  async function handleCreateJob(jobData: {
    title: string;
    type: string;
    location: string;
    budget: string;
    deadline: string;
    description: string;
  }) {
    try {
      const res = await fetch("/api/director/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobData),
      });

      if (res.ok) {
        const data = await res.json();
        // API returns { job: {...} }, so we need to use data.job
        setJobs([...jobs, data.job]);
        setShowCreateModal(false);
        // Refresh director profile to update capabilities
        const profileRes = await fetch("/api/director/profile");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const trustScore = profileData.profile.trustScore || 0;
          const trustLevel = getTrustLevel(trustScore);
          const capabilities = getDirectorCapabilities(trustLevel);
          setDirectorProfile({
            trustScore,
            emailVerified: profileData.profile.emailVerified,
          });
          setDirectorCapabilities({
            canBulkShortlist: capabilities.canBulkShortlist,
            canBulkReject: capabilities.canBulkReject,
            maxActiveJobs: capabilities.maxActiveJobs,
          });
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        // Handle job limit error specifically
        if (errorData.error === "JOB_LIMIT_REACHED") {
          alert(errorData.message || `You have reached your limit of ${errorData.maxActiveJobs} active job posting${errorData.maxActiveJobs === 1 ? "" : "s"}.`);
        } else {
          const errorMessage = errorData.error || "Failed to create job. Please try again.";
          alert(errorMessage);
        }
        throw new Error(errorData.error || "Failed to create job"); // Re-throw to let modal handle loading state
      }
    } catch (error) {
      console.error("Failed to create job:", error);
      if (error instanceof Error && error.message.includes("Failed to create")) {
        throw error; // Re-throw API errors
      }
      alert("Network error. Please check your connection and try again.");
      throw error; // Re-throw to let modal handle loading state
    }
  }

  // Handle application status update
  async function handleStatusUpdate(
    appId: string,
    status: "shortlisted" | "rejected"
  ) {
    try {
      const res = await fetch(`/api/director/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update the application in state
        setApplications((prev) =>
          prev.map((app) =>
            app._id === appId ? { ...app, status: data.application.status } : app
          )
        );
        // Refresh jobs to update application counts
        const jobsRes = await fetch("/api/director/jobs");
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          setJobs(jobsData.jobs || []);
        }
      } else {
        const errorData = await res.json();
        const errorMessage = errorData.error || "Failed to update status. Please try again.";
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Network error. Please check your connection and try again.");
    }
  }

  // Handle messaging
  function handleMessage(appId: string) {
    const app = applications.find((a) => a._id === appId);
    if (app) {
      setSelectedApplication(app);
      setShowMessageModal(true);
    }
  }

  // Handle sending message
  async function handleSendMessage(message: string, method: "in-app" | "email" | "phone") {
    if (!selectedApplication) return;

    try {
      const res = await fetch("/api/director/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: selectedApplication._id,
          message,
          deliveryMethod: method,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Message sent via ${method}.`);
        setShowMessageModal(false);
        setSelectedApplication(null);
      } else {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to send message. Please try again.";
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Network error. Please check your connection and try again.");
    }
  }

  // Handle job update
  async function handleUpdateJob(updatedJob: Omit<Job, "applicationCount">) {
    try {
      // Refresh jobs list to get updated data from server
      const jobsRes = await fetch("/api/director/jobs");
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(jobsData.jobs || []);
      }
      
      // Update local state
      setJobs((prev) =>
        prev.map((job) =>
          job.id === updatedJob.id
            ? { ...updatedJob, applicationCount: job.applicationCount }
            : job
        )
      );
      setEditingJob(null);
      
      // If the updated job is the selected job, update it
      if (selectedJob && selectedJob.id === updatedJob.id) {
        setSelectedJob({ ...updatedJob, applicationCount: selectedJob.applicationCount });
      }
    } catch (error) {
      console.error("Failed to refresh jobs after update:", error);
      // Still update local state even if refresh fails
      setJobs((prev) =>
        prev.map((job) =>
          job.id === updatedJob.id
            ? { ...updatedJob, applicationCount: job.applicationCount }
            : job
        )
      );
      setEditingJob(null);
    }
  }

  // Handle bulk actions
  async function handleBulkAction(ids: string[], action: "shortlist" | "reject") {
    try {
      const res = await fetch("/api/director/applications/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationIds: ids,
          status: action === "shortlist" ? "shortlisted" : "rejected",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Refresh applications
        if (selectedJob) {
          const appsRes = await fetch(`/api/director/applications?jobId=${selectedJob.id}`);
          if (appsRes.ok) {
            const appsData = await appsRes.json();
            setApplications(appsData.applications || []);
          }
        }
        // Refresh jobs to update counts
        const jobsRes = await fetch("/api/director/jobs");
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          setJobs(jobsData.jobs || []);
        }
        alert(`Successfully ${action === "shortlist" ? "shortlisted" : "rejected"} ${data.updated} application(s).`);
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to update applications. Please try again.");
      }
    } catch (error) {
      console.error("Failed to perform bulk action:", error);
      alert("Network error. Please check your connection and try again.");
    }
  }

  const handleShareJob = async (job: Job) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = `${origin}/jobs?jobId=${encodeURIComponent(job.id)}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("Share link copied to clipboard.");
    } catch (error) {
      alert(`Share link: ${shareUrl}`);
    }
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

      {/* Cinematic background gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/60 via-[var(--bg-main)] to-[var(--bg-main)] pointer-events-none z-0" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 sm:px-6 sm:py-12">
        {/* Header with cinematic background */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-8 sm:mb-12 relative overflow-hidden rounded-lg"
        >
          {/* Background image */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{
              backgroundImage:
                "url('https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1920')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />

          {/* Content */}
          <div className="relative z-10 p-4 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <p className="text-xs tracking-[0.3em] text-[var(--accent-gold)] mb-3">
                CASTING DIRECTOR
              </p>
              <h1 className="text-4xl md:text-5xl text-white mb-3 font-heading">
                Dashboard
              </h1>
              <p className="text-[var(--text-secondary)] text-lg">
                Manage your casting projects and discover talent
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-8 py-4 bg-[var(--accent-gold)] text-black font-medium rounded hover:opacity-90 transition shadow-lg shadow-[var(--accent-gold)]/20"
            >
              Create New Job
            </button>
          </div>
        </motion.div>

        {/* Email Verification Notice */}
        {!emailVerified && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-white/5 border border-white/10 rounded text-sm text-[var(--text-secondary)]"
          >
            <span className="text-[var(--accent-gold)]">Email verification required</span> to continue managing jobs and applications.
          </motion.div>
        )}

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
          className="mb-12"
        >
          <DirectorStats
            totalJobs={stats.totalJobs}
            totalApplications={stats.totalApplications}
            shortlisted={stats.shortlisted}
            rejected={stats.rejected}
          />
        </motion.div>

        {/* Trust Panel */}
        {directorProfile && emailVerified && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4, ease: "easeOut" }}
            className="mb-12"
          >
            <DirectorTrustPanel
              trustScore={directorProfile.trustScore}
              user={{ emailVerified: directorProfile.emailVerified }}
            />
          </motion.div>
        )}

        {/* Job Management Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
        >
          <div className="mb-6">
            <h2 className="text-2xl text-white mb-2">Your Jobs</h2>
            <p className="text-[var(--text-secondary)] text-sm">
              Click on a job to view and manage applications
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-[var(--text-secondary)]">Loading jobs...</p>
            </div>
          ) : (
            <JobList
              jobs={jobs}
              onJobClick={(job) => setSelectedJob(job)}
              onJobEdit={(job) => setEditingJob(job)}
              onJobShare={handleShareJob}
            />
          )}
        </motion.div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateJobModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateJob}
          />
        )}

        {selectedJob && session?.user?.emailVerified && (
          <ManageApplicantsModal
            job={selectedJob}
            applications={applications.filter(
              (app) => app.jobId === selectedJob.id
            )}
            loading={loadingApplications}
            onClose={() => setSelectedJob(null)}
            onShortlist={(id) => handleStatusUpdate(id, "shortlisted")}
            onReject={(id) => handleStatusUpdate(id, "rejected")}
            onMessage={handleMessage}
            onBulkAction={
              directorCapabilities?.canBulkShortlist && directorCapabilities?.canBulkReject
                ? handleBulkAction
                : undefined
            }
          />
        )}

        {editingJob && (
          <EditJobModal
            job={editingJob}
            onClose={() => setEditingJob(null)}
            onSave={handleUpdateJob}
          />
        )}

        {showMessageModal && selectedApplication && selectedJob && (
          <MessageModal
            talentId={selectedApplication.talentId}
            talentName={selectedApplication.talentName}
            jobTitle={selectedJob.title}
            onClose={() => {
              setShowMessageModal(false);
              setSelectedApplication(null);
            }}
            onSend={handleSendMessage}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CreateJobModal from "@/app/components/director/dashboard/modals/create-job-modal";

type Job = {
  _id: string;
  directorId: string;
  title: string;
  type: string;
  location: string;
  budget: string;
  deadline: string;
  description?: string;
  status: string;
  hidden: boolean;
  closedEarly: boolean;
  approvedByAdmin: boolean;
  approvedAt?: string;
  adminActionReason?: string;
  applicationCount: number;
  createdAt: string;
};

export default function AdminJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: "",
    hidden: "",
  });
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    async function autoApproveFromQuery() {
      if (typeof window === "undefined") return;
      const searchParams = new URLSearchParams(window.location.search);
      const approveJobId = searchParams.get("approveJobId");
      if (!approveJobId) return;

      try {
        const res = await fetch(`/api/admin/jobs/${approveJobId}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "Approved from email link" }),
        });
        if (res.ok) {
          alert("Job approved and now visible on public jobs.");
        } else {
          const d = await res.json().catch(() => ({}));
          alert(d.error || "Failed to approve job");
        }
      } catch (err) {
        console.error("Failed to auto-approve job:", err);
      } finally {
        searchParams.delete("approveJobId");
        const nextQuery = searchParams.toString();
        window.history.replaceState({}, "", `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`);
        window.location.reload();
      }
    }

    autoApproveFromQuery();
  }, []);

  const handleShare = async (jobId: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = `${origin}/jobs?jobId=${encodeURIComponent(jobId)}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("Share link copied to clipboard.");
    } catch (error) {
      alert(`Share link: ${shareUrl}`);
    }
  };

  const handleApprove = async (jobId: string) => {
    const reason = prompt("Reason for approving this job (optional):") || "Admin approved job";
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        alert("Job approved and now visible on public jobs.");
        fetchJobsDirect();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to approve job");
      }
    } catch (error) {
      console.error(error);
      alert("Network error. Please try again.");
    }
  };

  const handleEdit = async (job: Job) => {
    const title = prompt("Title", job.title);
    if (title === null) return;
    const type = prompt("Type", job.type);
    if (type === null) return;
    const location = prompt("Location", job.location);
    if (location === null) return;
    const budget = prompt("Budget", job.budget || "");
    if (budget === null) return;
    const deadline = prompt("Deadline", job.deadline || "");
    if (deadline === null) return;
    const description = prompt("Description", job.description || "");
    if (description === null) return;
    const status = prompt("Status (open/closed)", job.status);
    if (status === null) return;

    try {
      const res = await fetch(`/api/admin/jobs/${job._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          type,
          location,
          budget,
          deadline,
          description,
          status: status.toLowerCase(),
          reason: "Admin edited job",
        }),
      });
      if (res.ok) {
        alert("Job updated.");
        fetchJobsDirect();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to edit job");
      }
    } catch (error) {
      console.error(error);
      alert("Network error. Please try again.");
    }
  };

  const handleDelete = async (job: Job) => {
    if (!confirm(`Delete job "${job.title}"? This removes related applications and messages.`)) {
      return;
    }
    const reason = prompt("Reason for deleting this job (required):");
    if (!reason || !reason.trim()) return;
    try {
      const res = await fetch(`/api/admin/jobs/${job._id}?reason=${encodeURIComponent(reason.trim())}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert("Job deleted.");
        fetchJobsDirect();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to delete job");
      }
    } catch (error) {
      console.error(error);
      alert("Network error. Please try again.");
    }
  };

  async function fetchJobsDirect() {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.hidden !== "") queryParams.append("hidden", filters.hidden);

      const res = await fetch(`/api/admin/jobs?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to fetch jobs");
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchJobsDirect();
  }, [filters]);

  const handleJobAction = async (jobId: string, action: "CLOSE_EARLY" | "HIDE" | "UNHIDE") => {
    const reason = prompt(`Reason for ${action === "CLOSE_EARLY" ? "closing early" : action === "HIDE" ? "hiding" : "unhiding"} this job:`);
    if (!reason || !reason.trim()) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: reason.trim() }),
      });

      if (res.ok) {
        // Refresh jobs list
        window.location.reload();
      } else {
        const errorData = await res.json();
        alert(`Failed: ${errorData.error}`);
      }
    } catch (err) {
      console.error("Failed to perform job action:", err);
      alert("Network error. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
        <p className="text-[var(--text-secondary)]">Loading jobs...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-4xl font-heading text-white">Admin: Job Management</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-(--accent-gold) text-black rounded hover:opacity-90 transition"
            >
              + Create Job
            </button>
            <Link
              href="/admin"
              className="px-4 py-2 border border-white/20 text-white rounded hover:bg-white/10 transition"
            >
              ← Back to Admin
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/30 rounded text-red-400">
            {error}
          </div>
        )}

        {/* Create Job Modal */}
        {showCreate && (
          <CreateJobModal
            showDirectorSelector={true}
            onClose={() => setShowCreate(false)}
            onSubmit={async (data) => {
              try {
                const res = await fetch('/api/admin/jobs', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data),
                });

                if (res.ok) {
                  setShowCreate(false);
                  // Refresh list
                  window.location.reload();
                } else {
                  const err = await res.json();
                  alert(err.error || 'Failed to create job');
                }
              } catch (err) {
                console.error('Failed to create job:', err);
                alert('Network error. Please try again.');
              }
            }}
          />
        )}

        {/* Filters */}
        <div className="flex gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={filters.hidden}
            onChange={(e) => setFilters({ ...filters, hidden: e.target.value })}
            className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white"
          >
            <option value="">All Visibility</option>
            <option value="false">Visible</option>
            <option value="true">Hidden</option>
          </select>
        </div>

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <div className="text-center py-16 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-xl text-white/60 mb-4">No jobs found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <motion.div
                key={job._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-lg p-4 sm:p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">{job.title}</h3>
                      {!job.approvedByAdmin && (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded border border-yellow-500/30">
                          PENDING APPROVAL
                        </span>
                      )}
                      {job.hidden && (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded border border-red-500/30">
                          HIDDEN
                        </span>
                      )}
                      {job.closedEarly && (
                        <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded border border-orange-500/30">
                          CLOSED EARLY
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs rounded border ${
                        job.status === "open"
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                      }`}>
                        {job.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mb-2">
                      {job.type} · {job.location}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Budget: {job.budget || "Not specified"} · Deadline: {job.deadline || "Not specified"}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-2">
                      {job.applicationCount} application{job.applicationCount !== 1 ? "s" : ""} · 
                      Posted {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                    {job.adminActionReason && (
                      <p className="text-xs text-red-400 mt-2">
                        Admin Action: {job.adminActionReason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={() => handleShare(job._id)}
                    className="px-4 py-2 border border-white/20 text-white rounded hover:bg-white/10 transition"
                  >
                    Share Job
                  </button>
                  {!job.approvedByAdmin && (
                    <button
                      onClick={() => handleApprove(job._id)}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                    >
                      Confirm / Approve
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(job)}
                    className="px-4 py-2 border border-blue-500 text-blue-300 rounded hover:bg-blue-500/10 transition"
                  >
                    Edit Job
                  </button>
                  <button
                    onClick={() => router.push(`/admin/jobs/${job._id}/applications`)}
                    className="px-4 py-2 border border-white/20 text-white rounded hover:bg-white/10 transition"
                  >
                    View Applications
                  </button>
                  <button
                    onClick={() => handleDelete(job)}
                    className="px-4 py-2 border border-red-500 text-red-400 rounded hover:bg-red-500/10 transition"
                  >
                    Delete Job
                  </button>
                  {job.status === "open" && (
                    <button
                      onClick={() => handleJobAction(job._id, "CLOSE_EARLY")}
                      className="px-4 py-2 border border-orange-500 text-orange-400 rounded hover:bg-orange-500/10 transition"
                    >
                      Close Early
                    </button>
                  )}
                  {!job.hidden ? (
                    <button
                      onClick={() => handleJobAction(job._id, "HIDE")}
                      className="px-4 py-2 border border-red-500 text-red-400 rounded hover:bg-red-500/10 transition"
                    >
                      Hide Job
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJobAction(job._id, "UNHIDE")}
                      className="px-4 py-2 bg-[var(--accent-gold)] text-black rounded hover:bg-[var(--accent-gold)]/90 transition"
                    >
                      Unhide Job
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


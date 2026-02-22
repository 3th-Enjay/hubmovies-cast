"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ModalShell from "@/app/components/modals/modal-shell";

type Job = {
  id: string;
  title: string;
  type: string;
  location: string;
  budget: string;
  deadline: string;
  status: "open" | "closed";
  description?: string;
};

type EditJobModalProps = {
  job: Job;
  onClose: () => void;
  onSave: (updatedJob: Omit<Job, "applicationCount">) => void;
};

export default function EditJobModal({ job, onClose, onSave }: EditJobModalProps) {
  const [formData, setFormData] = useState({
    title: job.title,
    type: job.type,
    location: job.location,
    budget: job.budget || "",
    deadline: job.deadline || "",
    description: job.description || "",
    status: job.status,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Update form data when job prop changes
  useEffect(() => {
    setFormData({
      title: job.title,
      type: job.type,
      location: job.location,
      budget: job.budget || "",
      deadline: job.deadline || "",
      description: job.description || "",
      status: job.status,
    });
  }, [job]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate required fields
    if (!formData.title || !formData.type || !formData.location) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/director/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          type: formData.type,
          location: formData.location,
          budget: formData.budget,
          deadline: formData.deadline,
          description: formData.description,
          status: formData.status,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onSave({
          id: job.id,
          ...data.job,
        });
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || "Failed to update job. Please try again.");
      }
    } catch (error) {
      console.error("Failed to update job:", error);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="space-y-5 sm:space-y-6"
      >
        {/* Header */}
        <div>
          <p className="text-xs tracking-[0.3em] text-[var(--accent-gold)] mb-2 font-body">
            EDIT JOB
          </p>
          <h2 className="text-2xl text-white font-heading">Update Casting Call</h2>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400 font-body">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2 font-body">
              Job Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full bg-white/5 border border-white/10 p-3 rounded text-white focus:outline-none focus:border-[var(--accent-gold)]/50 font-body"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2 font-body">
                Role Type *
              </label>
              <input
                type="text"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 p-3 rounded text-white focus:outline-none focus:border-[var(--accent-gold)]/50 font-body"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2 font-body">
                Location *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 p-3 rounded text-white focus:outline-none focus:border-[var(--accent-gold)]/50 font-body"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2 font-body">
                Budget
              </label>
              <input
                type="text"
                value={formData.budget}
                onChange={(e) =>
                  setFormData({ ...formData, budget: e.target.value })
                }
                placeholder="$5,000 - $10,000"
                className="w-full bg-white/5 border border-white/10 p-3 rounded text-white focus:outline-none focus:border-[var(--accent-gold)]/50 font-body"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2 font-body">
                Deadline
              </label>
              <input
                type="text"
                value={formData.deadline}
                onChange={(e) =>
                  setFormData({ ...formData, deadline: e.target.value })
                }
                placeholder="Closes in 7 days"
                className="w-full bg-white/5 border border-white/10 p-3 rounded text-white focus:outline-none focus:border-[var(--accent-gold)]/50 font-body"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2 font-body">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
              className="w-full bg-white/5 border border-white/10 p-3 rounded text-white focus:outline-none focus:border-[var(--accent-gold)]/50 resize-none font-body"
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2 font-body">
              Status
            </label>
            <div className="flex flex-wrap gap-3">
              {(["open", "closed"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFormData({ ...formData, status })}
                  className={`px-4 py-2 text-sm rounded border transition font-body min-w-[96px] ${
                    formData.status === status
                      ? "bg-[var(--accent-gold)]/20 text-[var(--accent-gold)] border-[var(--accent-gold)]/30"
                      : "bg-white/5 text-[var(--text-secondary)] border-white/10 hover:border-white/20"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-white/20 text-white rounded hover:bg-white/10 transition font-body"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-[var(--accent-gold)] text-black rounded hover:opacity-90 transition disabled:opacity-50 font-body font-medium"
            >
              {loading ? "Updating..." : "Update Job"}
            </button>
          </div>
        </form>
      </motion.div>
    </ModalShell>
  );
}




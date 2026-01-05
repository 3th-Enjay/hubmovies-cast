"use client";

import { motion, AnimatePresence } from "framer-motion";

type Application = {
  _id: string;
  jobId: string;
  talentId: string;
  answer: string;
  mediaUrl: string;
  status: "submitted" | "shortlisted" | "rejected";
  createdAt: string;
  job: {
    id: string;
    title: string;
    type: string;
    location: string;
    budget: string;
    deadline: string;
    description?: string;
  } | null;
  hasMessages: boolean;
};

type ApplicationDetailModalProps = {
  application: Application;
  onClose: () => void;
};

export default function ApplicationDetailModal({
  application,
  onClose,
}: ApplicationDetailModalProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "shortlisted":
        return "text-[var(--accent-gold)] border-[var(--accent-gold)]/30";
      case "rejected":
        return "text-[#8f1d18] border-[#8f1d18]/30";
      default:
        return "text-[var(--text-secondary)] border-white/10";
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[var(--bg-main)] text-white shadow-2xl"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 border-b border-white/10 bg-[var(--bg-main)] p-6 z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-heading font-semibold">
                Application Details
              </h2>
              <button
                onClick={onClose}
                className="text-[var(--text-secondary)] hover:text-white transition"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Job Info */}
            {application.job && (
              <div>
                <h3 className="text-lg font-semibold mb-2">{application.job.title}</h3>
                <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                  <p><span className="text-white">Type:</span> {application.job.type}</p>
                  <p><span className="text-white">Location:</span> {application.job.location}</p>
                  <p><span className="text-white">Budget:</span> {application.job.budget}</p>
                  <p><span className="text-white">Deadline:</span> {new Date(application.job.deadline).toLocaleDateString()}</p>
                </div>
              </div>
            )}

            {/* Status */}
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-2">Status</p>
              <span
                className={`inline-block px-3 py-1 rounded border text-sm capitalize ${getStatusColor(application.status)}`}
              >
                {application.status}
              </span>
            </div>

            {/* Answer */}
            {application.answer && (
              <div>
                <p className="text-sm text-[var(--text-secondary)] mb-2">Your Answer</p>
                <p className="text-white whitespace-pre-wrap">{application.answer}</p>
              </div>
            )}

            {/* Media */}
            {application.mediaUrl && (
              <div>
                <p className="text-sm text-[var(--text-secondary)] mb-2">Media</p>
                <div className="border border-white/10 rounded overflow-hidden">
                  {application.mediaUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <img
                      src={application.mediaUrl}
                      alt="Application media"
                      className="w-full h-auto"
                    />
                  ) : (
                    <video
                      src={application.mediaUrl}
                      controls
                      className="w-full h-auto"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Created Date */}
            <div>
              <p className="text-sm text-[var(--text-secondary)]">
                Applied on {new Date(application.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 p-6">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 border border-white/20 text-white hover:border-white/40 transition font-body text-sm"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ModalShell from "@/app/components/modals/modal-shell";
import ApplicationsPanel from "../components/applications-panel";
import TalentProfileModal from "@/app/components/talent-profile-modal";

type Application = {
  _id: string;
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
};

type ManageApplicantsModalProps = {
  job: Job;
  applications: Application[];
  loading: boolean;
  onClose: () => void;
  onShortlist: (id: string) => void;
  onReject: (id: string) => void;
  onMessage: (id: string) => void;
  onBulkAction?: (ids: string[], action: "shortlist" | "reject") => void;
};

export default function ManageApplicantsModal({
  job,
  applications,
  loading,
  onClose,
  onShortlist,
  onReject,
  onMessage,
  onBulkAction,
}: ManageApplicantsModalProps) {
  const [selectedTalentProfile, setSelectedTalentProfile] = useState<any | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const handleViewProfile = async (talentId: string) => {
    try {
      setLoadingProfile(true);
      const res = await fetch(`/api/director/talent/${talentId}/profile`);
      if (res.ok) {
        const data = await res.json();
        setSelectedTalentProfile(data.user);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to load profile");
      }
    } catch (err) {
      console.error("Failed to fetch talent profile:", err);
      alert("Network error while fetching profile. Check console for details.");
    } finally {
      setLoadingProfile(false);
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
          <p className="text-xs tracking-[0.3em] text-[var(--accent-gold)] mb-2">
            MANAGE APPLICANTS
          </p>
          <h2 className="text-xl sm:text-2xl text-white mb-2">{job.title}</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {applications.length} {applications.length === 1 ? "application" : "applications"}
          </p>
        </div>

        {/* Applications List */}
        <ApplicationsPanel
          applications={applications}
          loading={loading}
          onShortlist={onShortlist}
          onReject={onReject}
          onMessage={onMessage}
          onBulkAction={onBulkAction}
          onViewProfile={handleViewProfile}
        />

        {/* Talent Profile Modal */}
        {selectedTalentProfile && (
          <TalentProfileModal
            talent={selectedTalentProfile}
            onClose={() => setSelectedTalentProfile(null)}
          />
        )}
      </motion.div>
    </ModalShell>
  );
}



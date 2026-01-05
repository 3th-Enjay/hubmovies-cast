"use client";

import { useState, useEffect } from "react";
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

type Message = {
  _id: string;
  message: string;
  senderRole: "director" | "talent";
  sentAt: string;
};

type MessageThreadModalProps = {
  application: Application;
  onClose: () => void;
};

export default function MessageThreadModal({
  application,
  onClose,
}: MessageThreadModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch(`/api/talent/messages?applicationId=${application._id}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMessages();
  }, [application._id]);

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
          className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-white/10 bg-[var(--bg-main)] text-white shadow-2xl"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-heading font-semibold">Messages</h2>
                {application.job && (
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    {application.job.title}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-[var(--text-secondary)] hover:text-white transition"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loading ? (
              <div className="text-center text-[var(--text-secondary)]">
                Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-[var(--text-secondary)]">
                No messages yet
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message._id}
                  className={`flex ${message.senderRole === "director" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.senderRole === "director"
                        ? "bg-white/5 border border-white/10"
                        : "bg-[var(--accent-gold)]/20 border border-[var(--accent-gold)]/30"
                    }`}
                  >
                    <p className="text-sm text-white whitespace-pre-wrap">
                      {message.message}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-2">
                      {new Date(message.sentAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 p-6">
            <p className="text-xs text-[var(--text-secondary)] text-center">
              Talent replies are coming soon
            </p>
            <button
              onClick={onClose}
              className="w-full mt-4 px-4 py-2 border border-white/20 text-white hover:border-white/40 transition font-body text-sm"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


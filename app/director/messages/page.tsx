"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "@/app/components/header";

type MessageThread = {
  applicationId: string;
  jobId: string;
  jobTitle: string;
  talentId: string;
  talentName: string | null;
  talentRole: string | null;
  lastMessage: string;
  lastMessageAt: string;
  messageCount: number;
  status: string;
};

export default function DirectorMessagesPage() {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchThreads() {
      try {
        const res = await fetch("/api/director/messages/threads");
        if (res.ok) {
          const data = await res.json();
          setThreads(data.threads || []);
        } else {
          setError("Failed to load messages");
        }
      } catch (err) {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchThreads();
  }, []);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[var(--bg-main)] pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="font-heading text-4xl text-white mb-2">
              Messages
            </h1>
            <p className="text-[var(--text-secondary)]">
              Manage your conversations with talents
            </p>
          </motion.div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-[var(--text-secondary)] font-body">Loading messages...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 font-body">{error}</p>
            </div>
          ) : threads.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--text-secondary)] font-body">
                No messages yet. Start a conversation from an application.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {threads.map((thread) => (
                <motion.div
                  key={thread.applicationId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 border border-white/10 p-6 rounded hover:bg-white/10 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg text-white font-heading">
                          {thread.talentName || `Talent ${thread.talentId.slice(0, 8)}`}
                        </h3>
                        <span className="px-2 py-1 text-xs bg-white/10 text-[var(--text-secondary)] rounded font-body">
                          {thread.status}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--accent-gold)] mb-1 font-body">
                        Re: {thread.jobTitle}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)] line-clamp-2 font-body">
                        {thread.lastMessage}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-xs text-[var(--text-secondary)] mb-1 font-body">
                        {new Date(thread.lastMessageAt).toLocaleDateString()}
                      </p>
                      {thread.messageCount > 1 && (
                        <span className="px-2 py-1 text-xs bg-[var(--accent-gold)]/20 text-[var(--accent-gold)] rounded font-body">
                          {thread.messageCount} messages
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}


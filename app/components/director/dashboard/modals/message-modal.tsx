"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ModalShell from "@/app/components/modals/modal-shell";

type MessageModalProps = {
  talentId: string;
  talentName?: string;
  jobTitle: string;
  onClose: () => void;
  onSend: (message: string, method: "in-app" | "email" | "phone") => void;
};

export default function MessageModal({
  talentId,
  talentName,
  jobTitle,
  onClose,
  onSend,
}: MessageModalProps) {
  const [message, setMessage] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"in-app" | "email" | "phone">("in-app");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      await onSend(message.trim(), deliveryMethod);
    } catch (error) {
      console.error("Failed to send message:", error);
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
          <p className="text-xs tracking-[0.3em] text-[var(--accent-gold)] mb-2">
            SEND MESSAGE
          </p>
          <h2 className="text-xl sm:text-2xl text-white mb-2">
            {talentName || `Talent ${talentId.slice(0, 8)}`}
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Re: {jobTitle}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Delivery Method */}
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2 font-body">
              Delivery Method
            </label>
            <div className="flex flex-wrap gap-3">
              {(["in-app", "email", "phone"] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setDeliveryMethod(method)}
                  className={`px-4 py-2 text-sm rounded border transition font-body ${
                    deliveryMethod === method
                      ? "bg-[var(--accent-gold)]/20 text-[var(--accent-gold)] border-[var(--accent-gold)]/30"
                      : "bg-white/5 text-[var(--text-secondary)] border-white/10 hover:border-white/20"
                  }`}
                >
                  {method === "in-app" ? "In-App" : method.charAt(0).toUpperCase() + method.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2 font-body">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={6}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-white placeholder-[var(--text-secondary)] text-sm font-body focus:outline-none focus:border-white/20 resize-none"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-white/20 text-[var(--text-secondary)] hover:border-white/40 hover:text-white transition font-body text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!message.trim() || loading}
              className="px-6 py-2 bg-[var(--accent-gold)] text-black font-medium rounded hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed font-body text-sm"
            >
              {loading ? "Sending..." : "Send Message"}
            </button>
          </div>
        </form>
      </motion.div>
    </ModalShell>
  );
}





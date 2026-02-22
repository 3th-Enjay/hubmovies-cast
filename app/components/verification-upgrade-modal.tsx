"use client";

import { motion, AnimatePresence } from "framer-motion";

interface VerificationUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VerificationUpgradeModal({
  isOpen,
  onClose,
}: VerificationUpgradeModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Modal */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative my-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#030C26] text-white shadow-2xl"
          >
            {/* Noise + Sheen */}
            <div className="pointer-events-none absolute inset-0 bg-[url('/noise.png')] opacity-[0.04]" />
            <div className="pointer-events-none absolute inset-0 animate-sheen bg-linear-to-r from-transparent via-white/5 to-transparent" />

            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/10 p-4 sm:p-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-white/60">
                  Talent Verification
                </p>
                <h2 className="mt-1 text-xl sm:text-2xl font-semibold">
                  Upgrade Your Profile
                </h2>
              </div>

              <button
                onClick={onClose}
                className="text-white/50 transition hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="space-y-6 sm:space-y-8 p-4 sm:p-6">
              {/* Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm text-white/80">
                <div>🎬 Priority casting visibility</div>
                <div>🛡️ Verified talent badge</div>
                <div>💳 Access to paid roles</div>
                <div>⚡ Faster shortlisting</div>
                <div>🌍 Global casting access</div>
                <div>📈 Higher profile ranking</div>
              </div>

              {/* Plans */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Basic */}
                <div className="rounded-xl border border-white/10 p-5">
                  <h3 className="font-medium">Basic Verification</h3>
                  <p className="mt-2 text-sm text-white/60">
                    Identity + profile review
                  </p>
                  <p className="mt-4 text-xl font-semibold">Free</p>
                  <button className="mt-4 w-full rounded-lg border border-white/20 py-2 text-sm transition hover:bg-white/10">
                    Start Free
                  </button>
                </div>

                {/* Pro */}
                <div className="relative rounded-xl border border-[#FFD166]/40 bg-[#031740] p-5">
                  <span className="absolute right-4 top-4 text-xs text-[#FFD166]">
                    Recommended
                  </span>
                  <h3 className="font-medium">Pro Verification</h3>
                  <p className="mt-2 text-sm text-white/70">
                    ID, video proof, priority review
                  </p>
                  <p className="mt-4 text-xl font-semibold">$9.99</p>
                  <button className="mt-4 w-full rounded-lg bg-[#FFD166] py-2 text-sm font-semibold text-black transition hover:opacity-90">
                    Upgrade to Pro
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 p-4 text-center text-xs text-white/50">
              Verification helps casting directors trust and hire faster.
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

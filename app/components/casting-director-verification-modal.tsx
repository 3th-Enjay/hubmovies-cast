"use client";

import { motion, AnimatePresence } from "framer-motion";

interface CastingDirectorVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CastingDirectorVerificationModal({
  isOpen,
  onClose,
}: CastingDirectorVerificationModalProps) {
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
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative my-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#030C26] text-white shadow-2xl"
          >
            {/* Atmosphere */}
            <div className="pointer-events-none absolute inset-0 bg-[url('/noise.png')] opacity-[0.04]" />
            <div className="pointer-events-none absolute inset-0 animate-sheen bg-gradient-to-r from-transparent via-white/5 to-transparent" />

            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/10 p-4 sm:p-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-white/60">
                  Casting Director Access
                </p>
                <h2 className="mt-1 text-xl sm:text-2xl font-semibold">
                  Verify Your Production Account
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
              {/* Trust Statement */}
              <p className="text-sm leading-relaxed text-white/75">
                Verification confirms your identity and production legitimacy,
                helping talents confidently apply and engage with your castings.
              </p>

              {/* Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm text-white/80">
                <div>🎥 Post verified casting calls</div>
                <div>🛡️ Trusted production badge</div>
                <div>📄 Contract & agreement tools</div>
                <div>💳 Secure payments & escrow</div>
                <div>🌍 Access global talent pool</div>
                <div>📈 Higher casting visibility</div>
              </div>

              {/* Plans */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Standard */}
                <div className="rounded-xl border border-white/10 p-5">
                  <h3 className="font-medium">Standard Verification</h3>
                  <p className="mt-2 text-sm text-white/60">
                    Identity + company review
                  </p>
                  <p className="mt-4 text-xl font-semibold">Free</p>
                  <button className="mt-4 w-full rounded-lg border border-white/20 py-2 text-sm transition hover:bg-white/10">
                    Start Verification
                  </button>
                </div>

                {/* Studio */}
                <div className="relative rounded-xl border border-[#4CC9F0]/40 bg-[#031740] p-5">
                  <span className="absolute right-4 top-4 text-xs text-[#4CC9F0]">
                    Studio Level
                  </span>
                  <h3 className="font-medium">Studio Verified</h3>
                  <p className="mt-2 text-sm text-white/70">
                    Priority review, branding & trust boost
                  </p>
                  <p className="mt-4 text-xl font-semibold">$19.99</p>
                  <button className="mt-4 w-full rounded-lg bg-[#4CC9F0] py-2 text-sm font-semibold text-black transition hover:opacity-90">
                    Upgrade to Studio
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 p-4 text-center text-xs text-white/50">
              Verified casting directors receive more applications and higher-quality talent.
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

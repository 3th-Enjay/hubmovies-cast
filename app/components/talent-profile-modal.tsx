"use client";

import { motion, AnimatePresence } from "framer-motion";

type Talent = {
  id: string;
  name: string;
  role: string;
  location: string;
  image: string;
  email?: string;
  bio?: string;
  verified?: boolean;
};

interface Props {
  talent: Talent | null;
  onClose: () => void;
}

export default function TalentProfileModal({ talent, onClose }: Props) {
  if (!talent) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.96, y: 40, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.96, y: 40, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative z-10 my-4 max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-(--bg-surface) border border-(--border-subtle) shadow-2xl rounded-xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Image */}
            <div className="relative aspect-[16/10] md:aspect-3/4 bg-black overflow-hidden">
              <img
                src={talent.image}
                alt={talent.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30" />
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 md:p-8 flex flex-col justify-between">
              <div>
                <h2 className="font-heading text-2xl sm:text-3xl mb-2 text-white">
                  {talent.name}
                </h2>

                <p className="text-sm tracking-wide text-(--accent-gold) mb-4">
                  {talent.role} · {talent.location}
                </p>

                {talent.verified ? (
                  <p className="text-(--text-secondary) leading-relaxed">
                    {talent.bio || "No bio available."}
                  </p>
                ) : (
                  <div className="mt-6 border border-(--border-subtle) p-6 text-center">
                    <p className="text-sm text-(--text-secondary)mb-4">
                      Full profile details are available to verified producers.
                    </p>
                    <button className="w-full sm:w-auto px-4 sm:px-6 py-3 text-sm sm:text-base bg-(--accent-gold) text-black font-semibold tracking-wide hover:opacity-90 transition">
                      Unlock Profile
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 sm:px-6 py-3 text-sm sm:text-base border border-white/20 text-white hover:bg-white/10 transition"
                >
                  Close
                </button>

                {talent.verified && talent.email && (
                  <a
                    href={`mailto:${talent.email}?subject=Talent%20Opportunity`}
                    className="w-full sm:w-auto px-4 sm:px-6 py-3 text-sm sm:text-base bg-(--accent-gold) text-black font-semibold tracking-wide hover:opacity-90 transition text-center"
                  >
                    Contact Talent
                  </a>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

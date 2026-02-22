"use client";

import { motion } from "framer-motion";

export default function ModalShell({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative z-10 my-4 w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl bg-(--bg-surface) border border-white/10 p-4 sm:p-6 rounded-2xl max-h-[90vh] overflow-y-auto"
      >
        {children}
      </motion.div>
    </div>
  );
}

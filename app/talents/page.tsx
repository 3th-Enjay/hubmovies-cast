"use client";

import { motion } from "framer-motion";
import Header from "@/app/components/header";
import TalentsPreview from "@/app/components/talents-preview";

export default function TalentsPage() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-[var(--bg-main)] pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <h1 className="font-heading text-5xl md:text-6xl text-white mb-4">
              Discover <span className="text-[var(--accent-gold)]">Talents</span>
            </h1>
            <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
              Browse our global network of actors, models, and performers ready for your next project.
            </p>
          </motion.div>

          {/* Talents Grid */}
          <TalentsPreview />
        </div>
      </div>
    </>
  );
}


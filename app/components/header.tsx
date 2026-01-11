"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import NotificationBell from "./notifications/notification-bell";

export default function Header() {
  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/40 border-b border-[var(--border-subtle)]"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="font-heading text-xl tracking-wide text-white"
        >
          Hub<span className="text-[var(--accent-gold)]">Movies</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm tracking-wide">
          <Link href="/jobs" className="text-[var(--text-secondary)] hover:text-white transition">
            Jobs
          </Link>
          <Link href="/talents" className="text-[var(--text-secondary)] hover:text-white transition">
            Talents
          </Link>
          <Link href="/how-it-works" className="text-[var(--text-secondary)] hover:text-white transition">
            How It Works
          </Link>
          <Link href="/pricing" className="text-[var(--text-secondary)] hover:text-white transition">
            Pricing
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <NotificationBell />
          <Link
            href="/talent/dashboard"
            className="text-sm text-[var(--text-secondary)] hover:text-white transition hidden md:block"
          >
            Dashboard
          </Link>
          <Link
            href="/auth/password"
            className="text-sm text-[var(--text-secondary)] hover:text-white transition"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 border border-[var(--accent-gold)] text-[var(--accent-gold)] text-sm hover:bg-[var(--accent-gold)] hover:text-black transition"
          >
            Get Started
          </Link>
        </div>
      </div>
    </motion.header>
  );
}

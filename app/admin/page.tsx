"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

export default function AdminDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to jobs management by default
    router.push("/admin/jobs");
  }, [router]);

  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <p className="text-[var(--text-secondary)] mb-4">Redirecting to admin dashboard...</p>
        <Link
          href="/admin/jobs"
          className="text-[var(--accent-gold)] hover:underline"
        >
          Go to Jobs Management
        </Link>
      </motion.div>
    </div>
  );
}


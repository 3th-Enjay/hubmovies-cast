"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!token) {
      setError("Invalid reset link");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password");
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/auth");
        }, 2000);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] relative flex items-center justify-center p-8">
      {/* Noise overlay */}
      <div
        className="fixed inset-0 opacity-[0.015] pointer-events-none z-0"
        style={{
          backgroundImage: "url('/noise.png')",
          backgroundRepeat: "repeat",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-heading text-white mb-2">
            Reset Password
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Enter your new password
          </p>
        </div>

        {success ? (
          <div className="p-6 bg-white/5 border border-white/10 rounded text-center">
            <p className="text-white mb-4">
              Password reset successfully! Redirecting to sign in...
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-white/5 border border-red-500/30 rounded text-sm text-red-400 font-body">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2 font-body">
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-white placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)]/50 font-body"
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2 font-body">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-white placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)]/50 font-body"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-[var(--accent-gold)] text-black font-medium rounded hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed font-body"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => router.push("/auth")}
                className="text-sm text-[var(--text-secondary)] hover:text-white transition font-body"
              >
                ← Back to Sign In
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}


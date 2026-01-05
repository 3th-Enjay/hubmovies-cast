"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send verification email");
      } else {
        setSuccess(true);
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
            Verify Your Email
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Please check your email for a verification link. If you didn't receive it, you can request a new one.
          </p>
        </div>

        {success ? (
          <div className="p-6 bg-white/5 border border-white/10 rounded text-center">
            <p className="text-white mb-4">
              Verification email sent! Please check your inbox.
            </p>
            <button
              onClick={() => router.push("/auth")}
              className="text-sm text-[var(--accent-gold)] hover:text-white transition font-body"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-white/5 border border-red-500/30 rounded text-sm text-red-400 font-body">
                {error}
              </div>
            )}

            <form onSubmit={handleResend} className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2 font-body">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-white placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)]/50 font-body"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-[var(--accent-gold)] text-black font-medium rounded hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed font-body"
              >
                {loading ? "Sending..." : "Resend Verification Email"}
              </button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <button
                onClick={() => router.push("/auth")}
                className="block w-full text-sm text-[var(--text-secondary)] hover:text-white transition font-body"
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


"use client";

import { motion } from "framer-motion";
import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"TALENT" | "DIRECTOR">("TALENT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const redirect = searchParams.get("redirect");

  // Check for role query parameter
  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "DIRECTOR") {
      setRole("DIRECTOR");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      // Create account with password via API
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();

      if (res.ok) {
        console.log("✅ Account created successfully", { email, role, emailSent: data?.emailSent });
        if (data?.emailSent) {
          setMessage("Account created! Please enter the OTP we just sent to your email.");
        } else {
          setMessage("Account created! We couldn't send the OTP email — you can still proceed to request an OTP.");
        }
        // Redirect to OTP entry page after a short delay
        setTimeout(() => {
          const nextUrl = `/auth/send-otp?email=${encodeURIComponent(email)}&locked=1${
            redirect ? `&redirect=${encodeURIComponent(redirect)}` : ""
          }`;
          router.push(nextUrl);
        }, 1000);
      } else {
        console.error("❌ Signup failed", { status: res.status, error: data.error, email });
        setError(data.error || "Failed to create account. Please try again.");
      }
    } catch (err) {
      console.error("❌ Signup error:", err, { email, role });
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
          <h1 className="text-3xl font-heading text-white mb-2">Create Account</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Join HubMovies Cast as a Talent or Director
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-white/5 border border-red-500/30 rounded text-sm text-red-400">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-white/5 border border-green-500/30 rounded text-sm text-green-400">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Selection */}
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-3 font-body">
              I am a <span className="text-[var(--accent-gold)]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("TALENT")}
                className={`px-4 py-3 rounded border transition font-medium ${
                  role === "TALENT"
                    ? "bg-[var(--accent-gold)] text-black border-[var(--accent-gold)]"
                    : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                }`}
              >
                Talent
              </button>
              <button
                type="button"
                onClick={() => setRole("DIRECTOR")}
                className={`px-4 py-3 rounded border transition font-medium ${
                  role === "DIRECTOR"
                    ? "bg-[var(--accent-gold)] text-black border-[var(--accent-gold)]"
                    : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                }`}
              >
                Director
              </button>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              {role === "TALENT"
                ? "Apply for roles and showcase your portfolio"
                : "Post casting calls and find talent"}
            </p>
            {role === "TALENT" && (
              <p className="text-xs text-[var(--accent-gold)] mt-1">
                Talent registration requires ID card front and back during profile setup.
              </p>
            )}
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2 font-body">
              Email <span className="text-[var(--accent-gold)]">*</span>
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

          {/* Password Input */}
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2 font-body">
              Password <span className="text-[var(--accent-gold)]">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="At least 8 characters"
                className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded text-white placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)]/50 font-body"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-white transition"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password Input */}
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2 font-body">
              Confirm Password <span className="text-[var(--accent-gold)]">*</span>
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
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-[var(--text-secondary)]">
            Already have an account?{" "}
            <Link
              href={`/auth/password${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
              className="text-[var(--accent-gold)] hover:underline font-body"
            >
              Sign In
            </Link>
          </p>
          <Link
            href={`/auth${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
            className="block text-sm text-[var(--text-secondary)] hover:text-white transition font-body"
          >
            ← Back to start
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
        <p className="text-[var(--text-secondary)]">Loading...</p>
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}

"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

type PaymentSettings = {
  ethAddress: string;
  btcAddress: string;
  registrationPrice: number;
};

export default function PaymentPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user as any;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<"ETH" | "BTC" | null>(null);
  const [txReference, setTxReference] = useState("");
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    // Check if user is logged in and is a TALENT
    if (status === "unauthenticated") {
      router.push("/auth");
      return;
    }

    if (user?.role !== "TALENT") {
      router.push(user?.role === "DIRECTOR" ? "/director/dashboard" : "/");
      return;
    }

    if ((user?.profileCompletion ?? 0) < 70) {
      router.push("/talent/profile");
      return;
    }

    fetchPaymentSettings();
  }, [status, user, router]);

  const fetchPaymentSettings = async () => {
    try {
      const res = await fetch("/api/talent/payment-settings", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings || {});
      } else {
        setSettings(null);
      }
    } catch (err) {
      console.error("Failed to fetch payment settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedMethod) {
      setError("Please select a payment method");
      return;
    }

    if (!txReference.trim()) {
      setError("Please provide your transaction hash or reference");
      return;
    }

    if (!agreed) {
      setError("Please agree to the terms and conditions");
      return;
    }

    setSubmitting(true);

    try {
      // Submit payment for admin review
      const res = await fetch(`/api/talent/submit-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: selectedMethod,
          paymentReference: txReference.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Redirect to profile completion page
        router.push("/talent/profile?step=complete");
      } else {
        setError(data.error || "Failed to submit payment. Please try again.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          <p className="text-red-400 mb-4">Payment settings are not configured yet. Please contact support.</p>
          <Link href="/talent/dashboard" className="text-[var(--accent-gold)] hover:underline">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const price = settings.registrationPrice || 300;

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
          <h1 className="text-3xl font-heading text-white mb-2">Profile Registration</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Complete your payment to unlock your talent profile
          </p>
        </div>

        {/* Price Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 bg-white/5 border border-[var(--accent-gold)]/30 rounded text-center"
        >
          <p className="text-sm text-[var(--text-secondary)] mb-2">Registration Fee</p>
          <p className="text-3xl font-heading text-[var(--accent-gold)] mb-2">${price}</p>
          <p className="text-xs text-[var(--text-secondary)]">Pay in ETH or BTC</p>
        </motion.div>

        {error && (
          <div className="mb-4 p-3 bg-white/5 border border-red-500/30 rounded text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Method Selection */}
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-3 font-body">
              Payment Method <span className="text-[var(--accent-gold)]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* ETH Option */}
              <motion.button
                type="button"
                onClick={() => setSelectedMethod("ETH")}
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded border-2 transition ${
                  selectedMethod === "ETH"
                    ? "bg-[var(--accent-gold)]/10 border-[var(--accent-gold)] text-[var(--accent-gold)]"
                    : "bg-white/5 border-white/10 text-white hover:border-white/20"
                }`}
              >
                <div className="text-2xl mb-2">Ξ</div>
                <div className="text-sm font-medium">Ethereum</div>
              </motion.button>

              {/* BTC Option */}
              <motion.button
                type="button"
                onClick={() => setSelectedMethod("BTC")}
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded border-2 transition ${
                  selectedMethod === "BTC"
                    ? "bg-[var(--accent-gold)]/10 border-[var(--accent-gold)] text-[var(--accent-gold)]"
                    : "bg-white/5 border-white/10 text-white hover:border-white/20"
                }`}
              >
                <div className="text-2xl mb-2">₿</div>
                <div className="text-sm font-medium">Bitcoin</div>
              </motion.button>
            </div>
          </div>

          {/* Payment Address */}
          {selectedMethod && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 bg-white/5 border border-white/10 rounded"
            >
              <p className="text-xs text-[var(--text-secondary)] mb-2">Send {selectedMethod} to:</p>
              <code className="block text-xs text-[var(--accent-gold)] break-all bg-black/50 p-3 rounded mb-3 font-mono">
                {selectedMethod === "ETH" ? settings.ethAddress : settings.btcAddress}
              </code>
              <button
                type="button"
                onClick={() => {
                  const address = selectedMethod === "ETH" ? settings.ethAddress : settings.btcAddress;
                  navigator.clipboard.writeText(address);
                }}
                className="text-xs text-[var(--text-secondary)] hover:text-white transition"
              >
                Copy address
              </button>
            </motion.div>
          )}

          {/* Transaction Reference */}
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2 font-body">
              Transaction Hash / Reference <span className="text-[var(--accent-gold)]">*</span>
            </label>
            <input
              type="text"
              value={txReference}
              onChange={(e) => setTxReference(e.target.value)}
              required
              placeholder="Paste your transaction hash here"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-white placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)]/50 font-body text-sm"
            />
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              We'll use this to verify your payment. Keep it for your records.
            </p>
          </div>

          {/* Agreement */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded accent-[var(--accent-gold)]"
            />
            <span className="text-xs text-[var(--text-secondary)]">
              I agree that this payment is non-refundable. Once verified by an admin, my profile will be unlocked.{" "}
              <span className="text-[var(--accent-gold)]">*</span>
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting || !selectedMethod || !txReference.trim() || !agreed}
            className="w-full px-6 py-3 bg-[var(--accent-gold)] text-black font-medium rounded hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed font-body"
          >
            {submitting ? "Submitting..." : "Submit Payment"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-[var(--text-secondary)] mb-2">
            Questions? <a href="mailto:support@hubmovies-cd.com" className="text-[var(--accent-gold)] hover:underline">Contact support</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

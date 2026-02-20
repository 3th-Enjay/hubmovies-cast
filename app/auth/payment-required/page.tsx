"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

type PaymentSettings = {
  ethAddress: string | null;
  btcAddress: string | null;
  ethPrice: number | null;
  btcPrice: number | null;
  registrationPrice: number;
};

export default function PaymentRequiredPage() {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await fetch("/api/talent/payment-settings", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const s = data.settings;
          setSettings({
            ethAddress: s?.ethAddress || null,
            btcAddress: s?.btcAddress || null,
            ethPrice: s?.ethPrice || null,
            btcPrice: s?.btcPrice || null,
            registrationPrice: s?.registrationPrice || 300,
          });
        } else {
          setError("Failed to load payment addresses");
        }
      } catch (err) {
        console.error("Error fetching payment addresses:", err);
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, []);

  const copyToClipboard = (text: string, type: "ETH" | "BTC") => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-white/5 border border-white/10 rounded-lg p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-heading text-white mb-2">Payment Required</h1>
            <p className="text-[var(--text-secondary)]">
              Complete your ${settings?.registrationPrice || 300} payment to unlock access to all casting opportunities
            </p>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded text-center text-[var(--text-secondary)]">
              Loading payment addresses...
            </div>
          )}

          {/* Payment Addresses */}
          {!loading && settings && (
            <div className="space-y-6 mb-8">
              {/* ETH Payment Option */}
              {settings.ethAddress && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <span className="text-2xl">⟠</span> Ethereum (ETH)
                    </h3>
                    <div className="text-right">
                      <div className="text-sm text-[var(--text-secondary)]">
                        USD Amount: <span className="text-white font-semibold">${settings.registrationPrice}</span>
                      </div>
                      {settings.ethPrice && (
                        <div className="text-xs text-[var(--text-secondary)] mt-1">
                          ({(settings.registrationPrice / settings.ethPrice).toFixed(4)} ETH)
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-black/30 rounded p-4 font-mono text-sm">
                      <p className="text-white break-all mb-2">{settings.ethAddress}</p>
                      <button
                        onClick={() => copyToClipboard(settings.ethAddress || "", "ETH")}
                        className="text-[var(--accent-gold)] hover:text-white transition text-xs"
                      >
                        {copied === "ETH" ? "✓ Copied" : "Copy Address"}
                      </button>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Send the required amount to this address from your wallet. Once confirmed on-chain, your account will be automatically unlocked.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* BTC Payment Option */}
              {settings.btcAddress && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/5 border border-white/10 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <span className="text-2xl">₿</span> Bitcoin (BTC)
                    </h3>
                    <div className="text-right">
                      <div className="text-sm text-[var(--text-secondary)]">
                        USD Amount: <span className="text-white font-semibold">${settings.registrationPrice}</span>
                      </div>
                      {settings.btcPrice && (
                        <div className="text-xs text-[var(--text-secondary)] mt-1">
                          ({(settings.registrationPrice / settings.btcPrice).toFixed(6)} BTC)
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-black/30 rounded p-4 font-mono text-sm">
                      <p className="text-white break-all mb-2">{settings.btcAddress}</p>
                      <button
                        onClick={() => copyToClipboard(settings.btcAddress || "", "BTC")}
                        className="text-[var(--accent-gold)] hover:text-white transition text-xs"
                      >
                        {copied === "BTC" ? "✓ Copied" : "Copy Address"}
                      </button>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Send the required amount to this address from your wallet. Once confirmed on-chain, your account will be automatically unlocked.
                    </p>
                  </div>
                </motion.div>
              )}

              {!settings.ethAddress && !settings.btcAddress && (
                <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded text-yellow-400 text-sm">
                  Payment addresses not configured yet. Please contact support.
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-8">
            <h3 className="text-white font-semibold mb-4">Payment Instructions</h3>
            <ol className="space-y-3 text-sm text-[var(--text-secondary)]">
              <li className="flex gap-3">
                <span className="text-[var(--accent-gold)] font-semibold min-w-fit">1.</span>
                <span>Choose your preferred payment method (ETH or BTC)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[var(--accent-gold)] font-semibold min-w-fit">2.</span>
                <span>Copy the wallet address above</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[var(--accent-gold)] font-semibold min-w-fit">3.</span>
                <span>Send the exact amount from your crypto wallet</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[var(--accent-gold)] font-semibold min-w-fit">4.</span>
                <span>Wait for blockchain confirmation (1-3 minutes)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[var(--accent-gold)] font-semibold min-w-fit">5.</span>
                <span>Your account will be automatically unlocked</span>
              </li>
            </ol>
          </div>

          {/* Help Text */}
          <div className="text-center space-y-4">
            <p className="text-xs text-[var(--text-secondary)]">
              Payment due once per registration. This unlocks permanent access to all casting jobs and opportunities.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/"
                className="text-sm text-[var(--accent-gold)] hover:text-white transition"
              >
                ← Back to Home
              </Link>
              <span className="text-white/20">•</span>
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-[var(--accent-gold)] hover:text-white transition"
              >
                Refresh Status
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

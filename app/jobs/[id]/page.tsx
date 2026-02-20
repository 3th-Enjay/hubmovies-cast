"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import ApplyFlowModal from "@/app/components/modals/apply-flow-modal";
import { getTrustBadge, getTrustStatusText } from "@/lib/director-trust";
import { usePaymentNavigation } from "@/lib/use-payment-navigation";
import { MIN_PROFILE_COMPLETION } from "@/lib/constants";

type Job = {
  _id: string;
  title: string;
  type: string;
  location: string;
  budget: string;
  deadline: string;
  description?: string;
  directorTrustScore?: number;
  status?: "open" | "closed";
};

export default function SharedJobPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const user = session?.user as any;
  const isTalent = user?.role === "TALENT";
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [checkingApplied, setCheckingApplied] = useState(false);
  const [access, setAccess] = useState<{
    paymentConfirmed: boolean;
    profileCompletion: number;
  }>({
    paymentConfirmed: !!user?.paymentConfirmed,
    profileCompletion: user?.profileCompletion ?? 0,
  });
  const { goToPayment, loading: paymentLoading } = usePaymentNavigation();

  const jobId = params.id;

  useEffect(() => {
    async function fetchJob() {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setJob(data.job || null);
        } else {
          const data = await res.json().catch(() => ({}));
          setLoadError(data?.error || "Job not found");
        }
      } catch (error) {
        setLoadError("Failed to load job");
      } finally {
        setLoading(false);
      }
    }

    fetchJob();
  }, [jobId]);

  useEffect(() => {
    if (!session || !isTalent) return;
    async function refreshAccess() {
      try {
        const res = await fetch("/api/talent/profile", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setAccess({
            paymentConfirmed: !!data?.profile?.paymentConfirmed,
            profileCompletion: data?.profile?.profileCompletion ?? 0,
          });
          return;
        }
      } catch {}
      setAccess({
        paymentConfirmed: !!user?.paymentConfirmed,
        profileCompletion: user?.profileCompletion ?? 0,
      });
    }
    refreshAccess();
  }, [session, isTalent, user?.paymentConfirmed, user?.profileCompletion]);

  useEffect(() => {
    if (!session || !jobId || !isTalent) return;
    async function checkApplied() {
      setCheckingApplied(true);
      try {
        const res = await fetch(`/api/apply/status?jobId=${jobId}`);
        if (res.status === 403) {
          setHasApplied(false);
          return;
        }
        const data = await res.json();
        setHasApplied(!!data.applied);
      } catch {
        setHasApplied(false);
      } finally {
        setCheckingApplied(false);
      }
    }
    checkApplied();
  }, [session, jobId, isTalent]);

  const needsProfile = isTalent && access.profileCompletion < MIN_PROFILE_COMPLETION;
  const needsPayment = isTalent && !access.paymentConfirmed;
  const isClosed = job?.status === "closed";

  const authRedirect = useMemo(() => `/auth?redirect=/jobs/${jobId}`, [jobId]);
  const signupRedirect = useMemo(
    () => `/signup?role=TALENT&redirect=/jobs/${jobId}`,
    [jobId]
  );
  const loginRedirect = useMemo(
    () => `/auth/password?redirect=/jobs/${jobId}`,
    [jobId]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
        <p className="text-[var(--text-secondary)]">Loading job...</p>
      </div>
    );
  }

  if (!job || loadError) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          <p className="text-white text-lg mb-2">Job not available</p>
          <p className="text-[var(--text-secondary)] text-sm mb-6">
            {loadError || "This job may have closed or been removed."}
          </p>
          <Link
            href="/"
            className="px-6 py-2 border border-white/20 text-white hover:border-white/40 transition text-sm inline-block"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] relative">
      <div
        className="fixed inset-0 opacity-[0.015] pointer-events-none z-0"
        style={{
          backgroundImage: "url('/noise.png')",
          backgroundRepeat: "repeat",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <div className="mb-6">
          <p className="text-xs tracking-[0.3em] text-[var(--accent-gold)] mb-2">
            CASTING OPPORTUNITY
          </p>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl text-white font-heading">
              {job.title}
            </h1>
            <span
              className={`px-2 py-1 text-xs rounded border ${
                isClosed
                  ? "bg-gray-500/20 text-gray-300 border-gray-500/30"
                  : "bg-green-500/20 text-green-400 border-green-500/30"
              }`}
            >
              {isClosed ? "CLOSED" : "OPEN"}
            </span>
          </div>
          <p className="text-[var(--text-secondary)]">
            {job.type} · {job.location}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/5 border border-white/10 rounded p-4">
            <p className="text-sm text-[var(--text-secondary)] mb-1">Budget</p>
            <p className="text-white">{job.budget || "Not specified"}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded p-4">
            <p className="text-sm text-[var(--text-secondary)] mb-1">Deadline</p>
            <p className="text-white">{job.deadline || "Not specified"}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded p-4">
            <p className="text-sm text-[var(--text-secondary)] mb-1">Location</p>
            <p className="text-white">{job.location}</p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded p-5 mb-6">
          <p className="text-[var(--text-secondary)] leading-relaxed">
            {job.description ||
              "This is a professionally curated casting opportunity from a verified producer."}
          </p>
        </div>

        {job.directorTrustScore !== undefined && (
          <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded">
            {(() => {
              const trustScore = job.directorTrustScore || 0;
              const badge = getTrustBadge(trustScore);
              const statusText = getTrustStatusText(badge.level);

              return (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <h4 className="text-sm font-medium text-white">
                      {statusText.title}
                    </h4>
                    <span
                      className={`px-2 py-1 text-xs rounded border ${badge.bgColor} ${badge.color} ${badge.borderColor}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {statusText.items.map((item, index) => (
                      <li
                        key={index}
                        className="text-sm text-[var(--text-secondary)]"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </>
              );
            })()}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {status === "unauthenticated" ? (
            <>
              <Link
                href={loginRedirect}
                className="px-6 py-3 bg-[var(--accent-gold)] text-black font-medium rounded hover:opacity-90 transition text-center"
              >
                Sign In to Apply
              </Link>
              <Link
                href={signupRedirect}
                className="px-6 py-3 border border-white/20 text-white rounded hover:bg-white/10 transition text-center"
              >
                Sign Up as Talent
              </Link>
              <Link
                href={authRedirect}
                className="px-6 py-3 border border-white/20 text-white rounded hover:bg-white/10 transition text-center"
              >
                More Options
              </Link>
            </>
          ) : !isTalent ? (
            <div className="text-[var(--text-secondary)] text-sm">
              Only talent accounts can apply for casting roles.
            </div>
          ) : isClosed ? (
            <>
              <div className="text-[var(--text-secondary)] text-sm">
                This job is closed and no longer accepting applications.
              </div>
              <Link
                href="/jobs"
                className="px-6 py-3 border border-white/20 text-white rounded hover:bg-white/10 transition text-center"
              >
                Browse Jobs
              </Link>
            </>
          ) : needsProfile ? (
            <>
              <Link
                href="/talent/profile"
                className="px-6 py-3 bg-[var(--accent-gold)] text-black font-medium rounded hover:opacity-90 transition text-center"
              >
                Complete Profile
              </Link>
              <p className="text-sm text-[var(--text-secondary)]">
                Your profile must be at least {MIN_PROFILE_COMPLETION}% complete.
              </p>
            </>
          ) : needsPayment ? (
            <>
              <button
                onClick={goToPayment}
                disabled={paymentLoading}
                className="px-6 py-3 bg-[var(--accent-gold)] text-black font-medium rounded hover:opacity-90 transition text-center disabled:opacity-60"
              >
                {paymentLoading ? "Loading..." : "Complete Payment"}
              </button>
              <p className="text-sm text-[var(--text-secondary)]">
                Payment required to unlock job applications.
              </p>
            </>
          ) : (
            <>
              <button
                onClick={() => setApplyOpen(true)}
                disabled={hasApplied || checkingApplied}
                className={`px-6 py-3 font-medium rounded transition ${
                  hasApplied
                    ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                    : "bg-[var(--accent-gold)] text-black hover:opacity-90"
                } ${checkingApplied ? "opacity-60 cursor-wait" : ""}`}
              >
                {checkingApplied ? "Checking..." : hasApplied ? "Applied" : "Apply Now"}
              </button>
              <Link
                href="/jobs"
                className="px-6 py-3 border border-white/20 text-white rounded hover:bg-white/10 transition text-center"
              >
                Browse Jobs
              </Link>
            </>
          )}
        </div>
      </div>

      {applyOpen && (
        <ApplyFlowModal
          jobId={jobId}
          jobTitle={job.title}
          directorTrustScore={job.directorTrustScore}
          onClose={() => setApplyOpen(false)}
        />
      )}
    </div>
  );
}

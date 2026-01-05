"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import StepBasics from "./step-basic";

// Placeholder step components
const StepRole = ({ formData, setFormData }: any) => (
  <div className="space-y-4">
    <p className="text-white/60">Role selection step (to be implemented)</p>
  </div>
);

const StepRequirements = ({ formData, setFormData }: any) => (
  <div className="space-y-4">
    <p className="text-white/60">Requirements step (to be implemented)</p>
  </div>
);

const StepCompensation = ({ formData, setFormData }: any) => (
  <div className="space-y-4">
    <p className="text-white/60">Compensation step (to be implemented)</p>
  </div>
);

const StepReview = ({ formData }: any) => (
  <div className="space-y-4">
    <p className="text-white/60">Review step (to be implemented)</p>
  </div>
);

const steps = [
  "Basics",
  "Role",
  "Requirements",
  "Compensation",
  "Review",
];

export default function CreateCastingModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<any>({});

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#030C26] text-white shadow-2xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
          >
            {/* Noise + Sheen */}
            <div className="pointer-events-none absolute inset-0 bg-[url('/noise.png')] opacity-[0.04]" />
            <div className="pointer-events-none absolute inset-0 animate-sheen bg-gradient-to-r from-transparent via-white/5 to-transparent" />

            {/* Header */}
            <div className="border-b border-white/10 p-6">
              <p className="text-xs uppercase tracking-widest text-white/60">
                Create Casting
              </p>
              <h2 className="mt-1 text-2xl font-semibold">
                {steps[step]}
              </h2>

              {/* Step Indicator */}
              <div className="mt-4 flex gap-2">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 w-full rounded-full ${
                      i <= step
                        ? "bg-[#4CC9F0]"
                        : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="p-6 min-h-[360px]">
              {step === 0 && <StepBasics formData={formData} setFormData={setFormData} />}
              {step === 1 && <StepRole formData={formData} setFormData={setFormData} />}
              {step === 2 && <StepRequirements formData={formData} setFormData={setFormData} />}
              {step === 3 && <StepCompensation formData={formData} setFormData={setFormData} />}
              {step === 4 && <StepReview formData={formData} />}
            </div>

            {/* Footer */}
            <div className="flex justify-between border-t border-white/10 p-6">
              <button
                onClick={step === 0 ? onClose : prev}
                className="text-sm text-white/60 hover:text-white"
              >
                {step === 0 ? "Cancel" : "Back"}
              </button>

              <button
                onClick={step === steps.length - 1 ? () => {} : next}
                className="rounded-lg bg-[#4CC9F0] px-6 py-2 text-sm font-semibold text-black"
              >
                {step === steps.length - 1 ? "Publish Casting" : "Continue"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

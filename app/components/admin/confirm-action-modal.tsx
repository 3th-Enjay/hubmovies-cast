"use client";

import { motion, AnimatePresence } from "framer-motion";

type UserData = {
  _id: string;
  email: string;
  name?: string;
  verificationTier?: string;
  trustScore?: number;
  trustLevel?: string;
};

type ConfirmActionModalProps = {
  action: {
    actionType: string;
    beforeState: any;
    afterState: any;
    reason: string;
    metadata?: any;
  };
  user: UserData;
  userRole: "TALENT" | "DIRECTOR";
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmActionModal({
  action,
  user,
  userRole,
  onConfirm,
  onCancel,
}: ConfirmActionModalProps) {
  const formatActionType = (actionType: string) => {
    return actionType
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getActionDescription = () => {
    if (action.actionType === "TRUST_TIER_CHANGE") {
      const before = userRole === "TALENT"
        ? action.beforeState.verificationTier
        : action.beforeState.trustLevel;
      const after = userRole === "TALENT"
        ? action.afterState.verificationTier
        : action.afterState.trustLevel;
      return `${userRole === "TALENT" ? "Change" : "Demote"} ${userRole} from ${before} to ${after}`;
    }
    if (action.actionType === "TRUST_SCORE_OVERRIDE") {
      return `Override trust score from ${action.beforeState.trustScore} to ${action.afterState.trustScore}`;
    }
    return formatActionType(action.actionType);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      >
        <motion.div
          className="relative my-4 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[var(--bg-main)] border border-white/10 rounded-lg shadow-xl p-4 sm:p-6"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <h2 className="text-xl sm:text-2xl font-heading font-semibold text-white mb-4">
            Confirm Admin Action
          </h2>

          <div className="space-y-4 mb-6">
            <p className="text-white">You are about to:</p>
            <ul className="list-disc list-inside space-y-2 text-[var(--text-secondary)]">
              <li>{getActionDescription()}</li>
            </ul>

            <div>
              <p className="text-white mb-2">Reason:</p>
              <p className="text-[var(--text-secondary)] bg-white/5 p-3 rounded border border-white/10">
                {action.reason}
              </p>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
              <p className="text-red-400 text-sm">
                ⚠️ This action will be logged and cannot be undone without creating a new override.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-white/20 text-white hover:border-white/40 transition font-body text-sm"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded hover:bg-red-700 transition"
            >
              Confirm
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}




"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type UsePaymentNavigationOptions = {
  redirectTo?: string;
};

export function usePaymentNavigation(options: UsePaymentNavigationOptions = {}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const aliveRef = useRef(true);

  useEffect(() => {
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const goToPayment = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/talent/payment-settings", { cache: "no-store" });
      if (!res.ok) {
        return;
      }
      router.push(options.redirectTo || "/auth/payment");
    } finally {
      if (aliveRef.current) {
        setLoading(false);
      }
    }
  };

  return { goToPayment, loading };
}

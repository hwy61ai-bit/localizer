"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { getFlags, TOURROUTER_FLAGS, type FeatureFlags } from "./featureFlags";

const FeatureFlagContext = createContext<FeatureFlags>(TOURROUTER_FLAGS);

export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  const flags = useMemo(() => {
    if (typeof window === "undefined") return getFlags(false);
    return getFlags(window.location.hostname === "diy.hwy61labs.com");
  }, []);

  return (
    <FeatureFlagContext.Provider value={flags}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags(): FeatureFlags {
  return useContext(FeatureFlagContext);
}

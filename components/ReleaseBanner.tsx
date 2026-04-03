"use client";

import { useEffect, useState } from "react";
import { Button } from "./Button";
import { CURRENT_RELEASE_BANNER } from "@/lib/release-banner";

const DISMISSED_RELEASE_BANNER_KEY = "sfdc-tools:dismissed-release-banner-version";

export function ReleaseBanner() {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsMounted(true);

      try {
        const dismissedVersion = window.localStorage.getItem(
          DISMISSED_RELEASE_BANNER_KEY,
        );
        setIsVisible(dismissedVersion !== CURRENT_RELEASE_BANNER.version);
      } catch {
        setIsVisible(true);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const dismissBanner = () => {
    try {
      window.localStorage.setItem(
        DISMISSED_RELEASE_BANNER_KEY,
        CURRENT_RELEASE_BANNER.version,
      );
    } catch {
      // Ignore storage failures and still hide the banner for this session.
    }

    setIsVisible(false);
  };

  if (!isMounted || !isVisible) {
    return null;
  }

  return (
    <div className="border-b border-[var(--primary-color)] bg-[var(--primary-color)] px-3 py-2 text-[var(--primary-text)] md:px-4">
      <div className="relative flex items-center justify-center">
        <div className="min-w-0 text-center">
          <div className="text-sm font-semibold text-[var(--primary-text)]">
            {CURRENT_RELEASE_BANNER.title}
          </div>
          <div className="text-xs text-[var(--primary-text)]/90">
            {CURRENT_RELEASE_BANNER.description}
          </div>
        </div>

        <div className="absolute right-0 top-1/2 -translate-y-1/2">
          <Button
            type="button"
            size="sm"
            onClick={dismissBanner}
            className="border-white/70 bg-transparent text-[var(--primary-text)] hover:bg-white/10"
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}

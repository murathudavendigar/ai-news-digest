"use client";

import { useEffect, useState } from "react";
import OnboardingFlow, { ONBOARDING_KEY } from "./OnboardingFlow";

/**
 * Layout'a sarılır. İlk ziyarette onboarding ekranını gösterir.
 * data-onboarding-active ile Push/PWA prompt'ları susturulur.
 */
export default function OnboardingProvider({ children }) {
  const [show, setShow] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      const done = localStorage.getItem(ONBOARDING_KEY);
      if (!done) setShow(true);
      setChecked(true);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (show) {
      document.documentElement.dataset.onboardingActive = "1";
    } else {
      delete document.documentElement.dataset.onboardingActive;
    }
    return () => {
      delete document.documentElement.dataset.onboardingActive;
    };
  }, [show]);

  return (
    <>
      {children}
      {checked && show && (
        <OnboardingFlow
          onComplete={() => {
            setShow(false);
            delete document.documentElement.dataset.onboardingActive;
          }}
        />
      )}
    </>
  );
}

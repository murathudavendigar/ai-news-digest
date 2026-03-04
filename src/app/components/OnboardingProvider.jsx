"use client";

import { useEffect, useState } from "react";
import OnboardingFlow, { ONBOARDING_KEY } from "./OnboardingFlow";

/**
 * Layout'a sarılır. İlk ziyarette onboarding ekranını gösterir,
 * tamamlandıktan sonra localStorage'a işaretler ve bir daha göstermez.
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

  return (
    <>
      {children}
      {checked && show && <OnboardingFlow onComplete={() => setShow(false)} />}
    </>
  );
}

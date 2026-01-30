"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Settings are now opened as a modal from the header (gear icon).
 * This route redirects to home so old links still work.
 */
export default function SettingsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return null;
}

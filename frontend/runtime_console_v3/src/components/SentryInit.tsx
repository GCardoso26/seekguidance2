"use client";

import { initClientSentry } from "@/lib/sentry";
import { useEffect } from "react";

export function SentryInit() {
  useEffect(() => {
    initClientSentry();
  }, []);
  return null;
}

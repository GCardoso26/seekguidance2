"use client";

import { installConsoleFilter } from "@/lib/console-filter";
import { useEffect } from "react";

export function ConsoleFilterInit() {
  useEffect(() => {
    installConsoleFilter();
  }, []);
  return null;
}

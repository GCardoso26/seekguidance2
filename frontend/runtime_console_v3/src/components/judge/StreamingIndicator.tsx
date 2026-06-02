"use client";

import { PipelineOrb } from "@/components/judge/PipelineOrb";

interface StreamingIndicatorProps {
  phase: string | null;
}

/** @deprecated Nome legado — usa PipelineOrb. */
export function StreamingIndicator({ phase }: StreamingIndicatorProps) {
  return <PipelineOrb phase={phase} className="my-4" />;
}

export { PipelineOrb };

"use client";

import { useQuery } from "@tanstack/react-query";

export function useOrganizerAnalytics(days = 90) {
  return useQuery({
    queryKey: ["organizer-analytics", days],
    queryFn: async () => {
      const res = await fetch(`/api/organizers/analytics?days=${days}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Analytics indisponível");
      return res.json();
    },
  });
}

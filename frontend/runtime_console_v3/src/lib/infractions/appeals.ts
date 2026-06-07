import type { InfractionReport } from "@/lib/infractions/schema";

export class AppealManager {
  requestAppeal(report: InfractionReport, reason: string): InfractionReport {
    if (!report.resolution) {
      throw new Error("Só é possível apelar reports já resolvidos.");
    }
    return {
      ...report,
      status: "appealed",
      appeal: {
        reason,
        requested_at: new Date().toISOString(),
        status: "pending",
      },
      updated_at: new Date().toISOString(),
    };
  }

  reviewAppeal(
    report: InfractionReport,
    judgeId: string,
    decision: "accepted" | "rejected",
    notes: string,
  ): InfractionReport {
    if (report.status !== "appealed" || !report.appeal) {
      throw new Error("Report sem appeal pendente.");
    }
    return {
      ...report,
      status: decision === "accepted" ? "open" : "closed",
      appeal: {
        ...report.appeal,
        status: decision,
        reviewed_by: judgeId,
        review_notes: notes,
      },
      updated_at: new Date().toISOString(),
    };
  }
}

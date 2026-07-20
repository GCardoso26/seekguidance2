import { createLogger } from "../../platform/logging/logger.js";

const log = createLogger("product-catalog.sync-notify");

export interface SyncFailurePayload {
  jobKey: string;
  providerId: string;
  errors: string[];
  requestId?: string;
}

/** DLQ / falha de provider → webhook (Slack/Discord/generic). */
export async function notifySyncFailure(payload: SyncFailurePayload): Promise<void> {
  const url =
    process.env.PRODUCT_CATALOG_SYNC_WEBHOOK_URL ??
    process.env.SLACK_WEBHOOK_URL ??
    process.env.DISCORD_WEBHOOK_URL;
  if (!url) {
    log.warn({ ...payload }, "sync_failure_no_webhook");
    return;
  }
  const body = {
    text: `[Product Catalog] Falha ${payload.jobKey} / ${payload.providerId}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Sync failed*\n• Job: \`${payload.jobKey}\`\n• Provider: \`${payload.providerId}\`\n• Errors: ${payload.errors.slice(0, 5).join("; ")}`,
        },
      },
    ],
  };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) log.error({ status: res.status }, "sync_webhook_failed");
  } catch (e) {
    log.error({ err: String(e) }, "sync_webhook_error");
  }
}

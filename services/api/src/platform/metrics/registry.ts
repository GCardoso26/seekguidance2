/** Prometheus-style metric names. */
export type MetricName =
  | "sync_duration_seconds"
  | "sync_cards_total"
  | "sync_errors_total"
  | "queue_depth"
  | "outbox_backlog"
  | "outbox_published_total"
  | "outbox_dead_total"
  | "outbox_publish_duration_seconds"
  | "outbox_oldest_pending_age_seconds";

type Labels = Record<string, string>;

class MetricsRegistry {
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();
  private histograms = new Map<string, number[]>();

  private key(name: string, labels?: Labels): string {
    if (!labels) return name;
    const parts = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(",");
    return `${name}{${parts}}`;
  }

  inc(name: MetricName, labels?: Labels, by = 1): void {
    const k = this.key(name, labels);
    this.counters.set(k, (this.counters.get(k) ?? 0) + by);
  }

  setGauge(name: MetricName, value: number, labels?: Labels): void {
    this.gauges.set(this.key(name, labels), value);
  }

  observe(name: MetricName, value: number, labels?: Labels): void {
    const k = this.key(name, labels);
    const arr = this.histograms.get(k) ?? [];
    arr.push(value);
    this.histograms.set(k, arr);
  }

  getCounter(name: MetricName, labels?: Labels): number {
    return this.counters.get(this.key(name, labels)) ?? 0;
  }

  getGauge(name: MetricName, labels?: Labels): number {
    return this.gauges.get(this.key(name, labels)) ?? 0;
  }

  snapshot(): Record<string, number | number[]> {
    const out: Record<string, number | number[]> = {};
    for (const [k, v] of this.counters) out[`counter:${k}`] = v;
    for (const [k, v] of this.gauges) out[`gauge:${k}`] = v;
    for (const [k, v] of this.histograms) out[`histogram:${k}`] = v;
    return out;
  }

  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
}

export const metrics = new MetricsRegistry();

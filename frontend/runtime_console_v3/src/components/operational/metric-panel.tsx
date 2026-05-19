"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MetricPanel({ title, value, hint }: { title: string; value: string | number; hint?: string }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm text-muted-foreground font-normal">{title}</CardTitle></CardHeader>
      <CardContent><p className="text-2xl font-semibold">{value}</p>{hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}</CardContent>
    </Card>
  );
}

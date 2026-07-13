/**
 * Compatibilidade JSX para libs class-based / ForwardRef com React 19 + @types/react 19.
 * Não altera runtime — apenas tipagem para type-check RC1.
 */
import type { ComponentType, ReactNode } from "react";

declare module "recharts" {
  // Componentes de chart usados no app (recharts 2.x + React 19 types)
  export const ResponsiveContainer: ComponentType<Record<string, unknown>>;
  export const AreaChart: ComponentType<Record<string, unknown>>;
  export const Area: ComponentType<Record<string, unknown>>;
  export const BarChart: ComponentType<Record<string, unknown>>;
  export const Bar: ComponentType<Record<string, unknown>>;
  export const LineChart: ComponentType<Record<string, unknown>>;
  export const Line: ComponentType<Record<string, unknown>>;
  export const PieChart: ComponentType<Record<string, unknown>>;
  export const Pie: ComponentType<Record<string, unknown>>;
  export const Cell: ComponentType<Record<string, unknown>>;
  export const XAxis: ComponentType<Record<string, unknown>>;
  export const YAxis: ComponentType<Record<string, unknown>>;
  export const ZAxis: ComponentType<Record<string, unknown>>;
  export const CartesianGrid: ComponentType<Record<string, unknown>>;
  export const Tooltip: ComponentType<Record<string, unknown>>;
  export const Legend: ComponentType<Record<string, unknown>>;
  export const ReferenceLine: ComponentType<Record<string, unknown>>;
  export const Brush: ComponentType<Record<string, unknown>>;
  export const RadarChart: ComponentType<Record<string, unknown>>;
  export const Radar: ComponentType<Record<string, unknown>>;
  export const PolarGrid: ComponentType<Record<string, unknown>>;
  export const PolarAngleAxis: ComponentType<Record<string, unknown>>;
  export const PolarRadiusAxis: ComponentType<Record<string, unknown>>;
  export const ComposedChart: ComponentType<Record<string, unknown>>;
  export const ScatterChart: ComponentType<Record<string, unknown>>;
  export const Scatter: ComponentType<Record<string, unknown>>;
}

declare module "@radix-ui/react-tabs" {
  type WithChildren = {
    children?: ReactNode;
    className?: string;
    [key: string]: unknown;
  };
  export const Root: ComponentType<WithChildren & { defaultValue?: string; value?: string; onValueChange?: (v: string) => void }>;
  export const List: ComponentType<WithChildren & { loop?: boolean }>;
  export const Trigger: ComponentType<WithChildren & { value: string; disabled?: boolean }>;
  export const Content: ComponentType<WithChildren & { value: string; forceMount?: true }>;
}

declare module "@radix-ui/react-dropdown-menu" {
  type WithChildren = {
    children?: ReactNode;
    className?: string;
    [key: string]: unknown;
  };
  export const Root: ComponentType<WithChildren & { open?: boolean; onOpenChange?: (o: boolean) => void }>;
  export const Trigger: ComponentType<WithChildren & { asChild?: boolean }>;
  export const Portal: ComponentType<WithChildren>;
  export const Content: ComponentType<WithChildren & { sideOffset?: number; align?: "start" | "center" | "end" }>;
  export const Item: ComponentType<WithChildren & { asChild?: boolean; onSelect?: (e: Event) => void; disabled?: boolean }>;
  export const Separator: ComponentType<WithChildren>;
  export const Label: ComponentType<WithChildren>;
  export const Group: ComponentType<WithChildren>;
  export const CheckboxItem: ComponentType<WithChildren & { checked?: boolean; onCheckedChange?: (c: boolean) => void }>;
  export const RadioGroup: ComponentType<WithChildren>;
  export const RadioItem: ComponentType<WithChildren & { value: string }>;
  export const Sub: ComponentType<WithChildren>;
  export const SubTrigger: ComponentType<WithChildren>;
  export const SubContent: ComponentType<WithChildren>;
}

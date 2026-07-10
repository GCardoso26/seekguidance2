import { cn } from "@/lib/utils";

type DataTableProps = {
  children: React.ReactNode;
  className?: string;
  stickyHeader?: boolean;
  density?: "comfortable" | "compact";
};

export function DataTable({
  children,
  className,
  stickyHeader = true,
  density = "comfortable",
}: DataTableProps) {
  return (
    <div className={cn("surface-card overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table
          className={cn(
            "w-full text-left text-sm",
            density === "compact" ? "[&_td]:py-2 [&_th]:py-2" : "[&_td]:py-3 [&_th]:py-3",
          )}
        >
          {children}
        </table>
      </div>
    </div>
  );
}

export function DataTableHeader({
  children,
  className,
  sticky = true,
}: {
  children: React.ReactNode;
  className?: string;
  sticky?: boolean;
}) {
  return (
    <thead
      className={cn(
        "border-b border-border bg-muted/50 text-caption font-medium uppercase tracking-wide text-muted-foreground",
        sticky && "sticky top-0 z-10 backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </thead>
  );
}

export function DataTableBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tbody className={cn("[&_tr:hover]:bg-muted/40 [&_tr]:transition-colors", className)}>{children}</tbody>;
}

export function DataTableRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tr className={cn("border-b border-border last:border-0", className)}>{children}</tr>;
}

export function DataTableHead({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn("px-4 font-medium", className)}>{children}</th>;
}

export function DataTableCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 text-foreground", className)}>{children}</td>;
}

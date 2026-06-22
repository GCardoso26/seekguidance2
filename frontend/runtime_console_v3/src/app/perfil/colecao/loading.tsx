import { Skeleton } from "@/components/ui/skeleton";

export default function ColecaoLoading() {
  return (
    <div className="container mx-auto max-w-4xl space-y-4 px-4 py-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

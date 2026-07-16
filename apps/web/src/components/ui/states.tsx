export function Loading({ label = "Carregando…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-sm text-zinc-600">
      <span
        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-emerald-700"
        aria-hidden
      />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="py-10 text-center">
      <p className="text-base font-medium text-zinc-900">{title}</p>
      {description ? <p className="mt-1 text-sm text-zinc-600">{description}</p> : null}
    </div>
  );
}

export function ErrorState({
  title = "Algo deu errado",
  description,
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <p className="font-medium">{title}</p>
      {description ? <p className="mt-1">{description}</p> : null}
    </div>
  );
}

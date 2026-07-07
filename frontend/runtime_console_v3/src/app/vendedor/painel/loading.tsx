import { InlineLoading } from "@/components/ui/async-state";

export default function SellerPanelLoading() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <InlineLoading message="Carregando…" />
    </div>
  );
}

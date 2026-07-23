import type { Metadata } from "next";
import { EcosystemHubClient } from "@/components/ecosystem/EcosystemHubClient";
import { withCanonical } from "@/lib/page-metadata";

export const metadata: Metadata = withCanonical("/ecossistema", {
  title: "Ecossistema JudgeTCG",
  description: "APIs públicas, SDK, widgets e ferramentas para lojas, torneios e criadores.",
});

export default function EcossistemaPage() {
  return <EcosystemHubClient />;
}

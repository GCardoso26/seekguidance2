import { CardPdpClient } from "@/src/components/buyer/CardPdpClient";

export default async function CardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CardPdpClient cardId={decodeURIComponent(id)} />;
}

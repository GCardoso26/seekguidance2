import { redirect } from "next/navigation";

type Props = { params: Promise<{ orderId: string }> };

export default async function PedidoAvaliarPage({ params }: Props) {
  const { orderId } = await params;
  redirect(`/orders/${orderId}/review`);
}

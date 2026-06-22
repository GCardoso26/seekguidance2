import { redirect } from "next/navigation";

/** Alias curto → checkout PIX do marketplace neutro. */
export default function CheckoutRedirectPage() {
  redirect("/marketplace/checkout");
}

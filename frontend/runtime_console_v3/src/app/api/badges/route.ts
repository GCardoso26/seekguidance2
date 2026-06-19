import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/api/supabase-user";
import { getBadgesWithProgress } from "@/lib/badges/service";

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ detail: "Não autenticado" }, { status: 401 });
  }
  const badges = await getBadgesWithProgress(userId);
  return NextResponse.json({ badges });
}

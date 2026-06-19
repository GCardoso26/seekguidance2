import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/api/supabase-user";
import { checkAndAwardBadges } from "@/lib/badges/service";

export async function POST() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ detail: "Não autenticado" }, { status: 401 });
  }
  const earned = await checkAndAwardBadges(userId);
  return NextResponse.json({ earned });
}

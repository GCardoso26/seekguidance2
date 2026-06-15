import { NextRequest, NextResponse } from "next/server";
import { getDailyLimitInfo } from "@/lib/api/plan-enforcement";
import { getAuthenticatedUserId } from "@/lib/api/supabase-user";

export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUserId();
  const info = await getDailyLimitInfo(req, userId);
  return NextResponse.json(info);
}

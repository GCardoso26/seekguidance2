import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  fetchRegistrationStatus,
  getTcgJudgeDb,
  registrationStatusMock,
} from "@/lib/tournament-registration-bff";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabaseAuth = await createSupabaseServerClient();
  if (!supabaseAuth) {
    return NextResponse.json(registrationStatusMock());
  }

  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  if (!user) {
    return NextResponse.json(registrationStatusMock());
  }

  const db = getTcgJudgeDb();
  if (!db) {
    return NextResponse.json(registrationStatusMock(user.id));
  }

  try {
    const status = await fetchRegistrationStatus(db, id, user.id);
    return NextResponse.json(status);
  } catch {
    return NextResponse.json(registrationStatusMock(user.id));
  }
}

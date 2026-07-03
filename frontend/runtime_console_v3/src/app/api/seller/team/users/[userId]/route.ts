import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import { sellerTeamUsersMock } from "@/lib/seller-team-mock";

type Ctx = { params: Promise<{ userId: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { userId } = await ctx.params;
  const body = await req.json();

  if (body.role) {
    try {
      const res = await fetch(
        `${TOURNAMENT_API_BASE}/runtime/judge/seller/team/users/${encodeURIComponent(userId)}/role`,
        {
          method: "PATCH",
          headers: { ...(await tournamentProxyHeaders()), "Content-Type": "application/json" },
          body: JSON.stringify({ role: body.role }),
        },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return NextResponse.json(await res.json());
    } catch {
      const user = sellerTeamUsersMock().users.find((u) => u.user_id === userId) ?? sellerTeamUsersMock().users[1];
      return NextResponse.json({ user: { ...user, role: body.role } });
    }
  }

  if (body.permissions) {
    try {
      const res = await fetch(
        `${TOURNAMENT_API_BASE}/runtime/judge/seller/team/users/${encodeURIComponent(userId)}/permissions`,
        {
          method: "PATCH",
          headers: { ...(await tournamentProxyHeaders()), "Content-Type": "application/json" },
          body: JSON.stringify({ permissions: body.permissions }),
        },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return NextResponse.json(await res.json());
    } catch {
      const user = sellerTeamUsersMock().users.find((u) => u.user_id === userId) ?? sellerTeamUsersMock().users[1];
      return NextResponse.json({ user: { ...user, permissions: body.permissions } });
    }
  }

  return NextResponse.json({ error: "invalid_body" }, { status: 400 });
}

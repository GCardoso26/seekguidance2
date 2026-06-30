import { NextRequest } from "next/server";
import { POST as registerPost } from "../registration/route";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Params) {
  return registerPost(req, ctx);
}

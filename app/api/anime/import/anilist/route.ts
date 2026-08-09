import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { importAniListUsername } from "@/lib/anilist";
import { upsertTrackedAnime } from "@/lib/tracked-anime";

export const runtime = "nodejs";

const schema = z.object({ username: z.string().min(1) });

export async function POST(request: NextRequest) {
  const body = schema.parse(await request.json());
  const items = await importAniListUsername(body.username);
  const saved = await upsertTrackedAnime(items);
  return NextResponse.json({ count: saved.length, saved });
}
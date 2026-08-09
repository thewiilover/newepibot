import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { importAniListMangaUsername } from "@/lib/manga";
import { upsertTrackedManga } from "@/lib/tracked-manga";

export const runtime = "nodejs";

const schema = z.object({ username: z.string().min(1) });

export async function POST(request: NextRequest) {
  const body = schema.parse(await request.json());
  const items = await importAniListMangaUsername(body.username);
  const saved = await upsertTrackedManga(items);
  return NextResponse.json({ count: saved.length, saved });
}
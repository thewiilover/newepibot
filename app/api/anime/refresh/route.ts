import { NextRequest, NextResponse } from "next/server";
import { refreshAllTrackedAnime, refreshTrackedAnimeRecord } from "@/lib/tracked-anime";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));

  if (body && typeof body.id === "string") {
    const updated = await refreshTrackedAnimeRecord(body.id);
    if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ ok: true, updated });
  }

  await refreshAllTrackedAnime();
  return NextResponse.json({ ok: true });
}

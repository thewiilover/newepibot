import { NextRequest, NextResponse } from "next/server";
import { importMyAnimeListXml } from "@/lib/myanimelist";
import { upsertTrackedAnime } from "@/lib/tracked-anime";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "XML export file is required" }, { status: 400 });
  }

  const xmlText = await file.text();
  const items = importMyAnimeListXml(xmlText);
  const saved = await upsertTrackedAnime(items);
  return NextResponse.json({ count: saved.length, saved });
}
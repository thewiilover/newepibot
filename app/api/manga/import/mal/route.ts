import { NextRequest, NextResponse } from "next/server";
import { importMyAnimeListMangaXml } from "@/lib/myanimelist";
import { upsertTrackedManga } from "@/lib/tracked-manga";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "XML export file is required" }, { status: 400 });
  }

  const xmlText = await file.text();
  const items = importMyAnimeListMangaXml(xmlText);
  const saved = await upsertTrackedManga(items);
  return NextResponse.json({ count: saved.length, saved });
}
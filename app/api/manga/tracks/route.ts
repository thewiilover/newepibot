import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const tracks = await db.trackedManga.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ tracks });
}
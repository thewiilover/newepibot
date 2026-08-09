import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const config = await db.botConfig.findUnique({ where: { id: 1 } });
  return NextResponse.json({ config });
}
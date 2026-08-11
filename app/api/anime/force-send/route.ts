import { NextResponse } from "next/server";
import { forceSendLatestReleaseNotifications } from "@/lib/force-release-notifications";

export const runtime = "nodejs";

export async function POST() {
  const result = await forceSendLatestReleaseNotifications();
  return NextResponse.json({ ok: true, ...result });
}

import { NextResponse } from "next/server";
import { forceSendLatestReleaseNotificationForTrack } from "@/lib/force-release-notifications";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const segments = new URL(request.url).pathname.split("/").filter(Boolean);
  const id = segments.at(-2);

  if (!id) {
    return NextResponse.json({ error: "Tracked anime id is required" }, { status: 400 });
  }

  const result = await forceSendLatestReleaseNotificationForTrack(id);
  if (!result.sent) {
    return NextResponse.json({ error: result.reason ?? "Unable to send notification" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, ...result });
}

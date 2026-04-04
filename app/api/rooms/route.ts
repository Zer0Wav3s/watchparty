import { NextRequest } from "next/server";

import { generateRoomId } from "@/lib/utils";

function getPartyKitHttpOrigin(request: NextRequest) {
  const configured = process.env.PARTYKIT_HOST || process.env.NEXT_PUBLIC_PARTYKIT_HOST;

  if (configured) {
    if (configured.startsWith("http://") || configured.startsWith("https://")) {
      return configured;
    }

    return `https://${configured}`;
  }

  const protocol = request.nextUrl.protocol === "https:" ? "https" : "http";
  return `${protocol}://127.0.0.1:1999`;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { pin?: string | null } | null;
  const roomId = generateRoomId();
  const origin = getPartyKitHttpOrigin(request);

  const initResponse = await fetch(`${origin}/parties/room/${roomId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pin: body?.pin?.trim() || null }),
  });

  if (!initResponse.ok) {
    return Response.json({ error: "Failed to initialize room" }, { status: 500 });
  }

  const room = (await initResponse.json()) as { hostToken: string | null };

  return Response.json({
    roomId,
    hostToken: room.hostToken ?? null,
  });
}

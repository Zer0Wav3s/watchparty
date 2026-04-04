import { NextRequest } from "next/server";

import { generateRoomId } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { pin?: string | null } | null;
  const roomId = generateRoomId();
  const pin = body?.pin?.trim() || null;

  // Room state is initialized lazily on the first WebSocket connection.
  // The PIN is stored in the client's sessionStorage and passed to PartyKit
  // via query params when connecting. No server-to-server HTTP call needed.

  return Response.json({
    roomId,
    pin: Boolean(pin),
  });
}

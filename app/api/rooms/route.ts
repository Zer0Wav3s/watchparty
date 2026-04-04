import { NextRequest } from "next/server";

import { generateRoomId } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { pin?: string | null } | null;
  const roomId = generateRoomId();
  const pin = body?.pin?.trim() || null;

  // Room state is initialized lazily on the first WebSocket connection.
  // We pass the PIN via query params so the PartyKit server can pick it up.
  // No HTTP call to PartyKit needed — avoids "Party room not found" on cold Durable Objects.

  return Response.json({
    roomId,
    pin: pin ? true : false,
  });
}

import type { ClientMessage, ServerMessage } from "@/lib/types";

export function getPartyKitHost() {
  return process.env.NEXT_PUBLIC_PARTYKIT_HOST || "127.0.0.1:1999";
}

export function getPartyKitWebSocketUrl(roomId: string, hostToken?: string | null) {
  const host = getPartyKitHost();
  const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const protocol = isLocal ? "ws" : "wss";
  const url = new URL(`${protocol}://${host}/parties/room/${roomId}`);

  if (hostToken) {
    url.searchParams.set("hostToken", hostToken);
  }

  return url.toString();
}

export function parseServerMessage(raw: MessageEvent<string>) {
  return JSON.parse(raw.data) as ServerMessage;
}

export function sendPartyMessage(socket: WebSocket | null, message: ClientMessage) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return false;
  }

  socket.send(JSON.stringify(message));
  return true;
}

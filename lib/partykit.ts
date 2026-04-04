import type { ClientMessage, ServerMessage } from "@/lib/types";

export function getPartyKitHost() {
  return process.env.NEXT_PUBLIC_PARTYKIT_HOST || "127.0.0.1:1999";
}

export function getPartyKitWebSocketUrl(
  roomId: string,
  options?: { hostToken?: string | null; pin?: string | null },
) {
  const host = getPartyKitHost();
  const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const protocol = isLocal ? "ws" : "wss";
  const url = new URL(`${protocol}://${host}/party/${roomId}`);

  if (options?.hostToken) {
    url.searchParams.set("hostToken", options.hostToken);
  }

  // Pass PIN on first connection so PartyKit can lazily initialize the room
  if (options?.pin) {
    url.searchParams.set("initPin", options.pin);
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

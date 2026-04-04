import type { Connection, ConnectionContext, Request, Room, Server, Worker } from "partykit/server";
import { customAlphabet } from "nanoid";

import type {
  ClientMessage,
  RoomState,
  SerializableRoomState,
  ServerMessage,
  ViewerState,
} from "../lib/types";
import { safeJsonParse } from "../lib/utils";

const STORAGE_KEY = "room-state";
const ROOM_ENDED_KEY = "room-ended-at";
const INACTIVE_ROOM_TTL_MS = 60 * 60 * 1000;
const hostTokenId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 16);

type ConnectionMeta = {
  authed: boolean;
};

export default class RoomServer implements Server {
  constructor(readonly room: Room) {}

  readonly options = {
    hibernate: true,
  };

  private state: RoomState = this.createDefaultState();
  private pinFailures = new Map<string, { count: number; windowStartedAt: number }>();

  async onStart() {
    const stored = await this.room.storage.get<SerializableRoomState>(STORAGE_KEY);
    this.state = stored ? this.deserializeState(stored) : this.createDefaultState();
  }

  async onConnect(conn: Connection<ConnectionMeta>, ctx: ConnectionContext) {
    await this.ensureStateLoaded();

    const roomEndedAt = await this.room.storage.get<number>(ROOM_ENDED_KEY);
    if (roomEndedAt) {
      conn.send(JSON.stringify({ type: "room-ended" } satisfies ServerMessage));
      conn.close(4404, "Room ended");
      return;
    }

    const requestUrl = new URL(ctx.request.url);
    const hostToken = requestUrl.searchParams.get("hostToken");
    const initPin = requestUrl.searchParams.get("initPin");

    if (!this.state.roomId) {
      this.state = {
        roomId: this.room.id,
        pin: initPin || null,
        hostToken: initPin ? hostTokenId() : null,
        hostConnectionId: null,
        videoUrl: null,
        videoType: null,
        isPlaying: false,
        position: 0,
        lastUpdateAt: Date.now(),
        viewers: new Map<string, ViewerState>(),
      };
      await this.room.storage.delete(ROOM_ENDED_KEY);
      await this.persistState();
    }

    const requiresPin = Boolean(this.state.pin);
    const autoAuthed = !requiresPin || (!!hostToken && hostToken === this.state.hostToken);

    conn.setState({ authed: autoAuthed });

    if (autoAuthed) {
      await this.room.storage.deleteAlarm();
      this.markViewer(conn.id, true);
      const isHost = this.ensureHost(conn.id);
      await this.persistState();
      this.sendAuthOk(conn, isHost);
      this.sendSync(conn, isHost);
      this.broadcastViewerCount();
      this.broadcastHostChanged();
      return;
    }

    conn.send(JSON.stringify({ type: "pin-required" } satisfies ServerMessage));
  }

  async onMessage(raw: string | ArrayBuffer | ArrayBufferView, conn: Connection<ConnectionMeta>) {
    await this.ensureStateLoaded();

    const message = this.parseMessage(raw);
    if (!message) {
      conn.send(JSON.stringify({ type: "error", error: "Invalid message payload" } satisfies ServerMessage));
      return;
    }

    if (message.type === "pin-auth") {
      await this.handlePinAuth(conn, message.pin, message.hostToken ?? null);
      return;
    }

    if (!conn.state?.authed) {
      conn.send(JSON.stringify({ type: "pin-required" } satisfies ServerMessage));
      return;
    }

    switch (message.type) {
      case "set-video": {
        if (this.state.hostConnectionId !== conn.id) {
          conn.send(JSON.stringify({ type: "error", error: "Only the host can change videos" } satisfies ServerMessage));
          return;
        }

        this.state.videoUrl = message.url;
        this.state.videoType = message.videoType;
        this.state.isPlaying = false;
        this.state.position = 0;
        this.state.lastUpdateAt = Date.now();
        await this.persistState();

        this.room.broadcast(
          JSON.stringify({
            type: "video-change",
            url: this.state.videoUrl,
            videoType: this.state.videoType,
            position: this.state.position,
            isPlaying: this.state.isPlaying,
          } satisfies ServerMessage),
        );
        return;
      }

      case "end-room": {
        if (this.state.hostConnectionId !== conn.id) {
          conn.send(JSON.stringify({ type: "error", error: "Only the host can end the room" } satisfies ServerMessage));
          return;
        }

        await this.endRoom();
        return;
      }

      case "play":
      case "pause":
      case "seek":
      case "heartbeat": {
        this.state.position = message.position;
        this.state.lastUpdateAt = Date.now();

        if (message.type === "play") {
          this.state.isPlaying = true;
        }

        if (message.type === "pause") {
          this.state.isPlaying = false;
        }

        await this.persistState();
        this.room.broadcast(JSON.stringify(message satisfies ServerMessage), [conn.id]);
        return;
      }

      default: {
        const exhaustive: never = message;
        return exhaustive;
      }
    }
  }

  async onClose(conn: Connection<ConnectionMeta>) {
    await this.ensureStateLoaded();

    if (!this.state.viewers.has(conn.id)) {
      return;
    }

    this.state.viewers.delete(conn.id);

    if (this.state.hostConnectionId === conn.id) {
      this.state.hostConnectionId = this.findNextHostId();
    }

    await this.persistState();

    if (this.state.viewers.size === 0) {
      await this.room.storage.setAlarm(Date.now() + INACTIVE_ROOM_TTL_MS);
    } else {
      await this.room.storage.deleteAlarm();
    }

    this.broadcastViewerCount();
    this.broadcastHostChanged();
  }

  async onAlarm() {
    await this.ensureStateLoaded();

    if (this.state.viewers.size > 0) {
      await this.room.storage.deleteAlarm();
      return;
    }

    await this.clearRoomState({ markEnded: false });
  }

  async onRequest(req: Request) {
    await this.ensureStateLoaded();

    if (req.method === "POST") {
      if (!this.state.roomId) {
        const body = (await req.json().catch(() => null)) as { pin?: string | null } | null;

        this.state = {
          roomId: this.room.id,
          pin: body?.pin?.trim() || null,
          hostToken: body?.pin ? hostTokenId() : null,
          hostConnectionId: null,
          videoUrl: null,
          videoType: null,
          isPlaying: false,
          position: 0,
          lastUpdateAt: Date.now(),
          viewers: new Map<string, ViewerState>(),
        };

        await this.room.storage.delete(ROOM_ENDED_KEY);
        await this.persistState();
      }

      return Response.json({
        ok: true,
        roomId: this.state.roomId,
        hostToken: this.state.hostToken,
      });
    }

    if (!this.state.roomId) {
      return Response.json({ ok: false, error: "Room not found" }, { status: 404 });
    }

    return Response.json({
      ok: true,
      roomId: this.state.roomId,
      hasPin: Boolean(this.state.pin),
      viewers: this.state.viewers.size,
      videoUrl: this.state.videoUrl,
      videoType: this.state.videoType,
      isPlaying: this.state.isPlaying,
      position: this.state.position,
    });
  }

  private async ensureStateLoaded() {
    if (this.state.roomId) {
      return;
    }

    const stored = await this.room.storage.get<SerializableRoomState>(STORAGE_KEY);
    this.state = stored ? this.deserializeState(stored) : this.createDefaultState();
  }

  private createDefaultState(): RoomState {
    return {
      roomId: "",
      pin: null,
      hostToken: null,
      hostConnectionId: null,
      videoUrl: null,
      videoType: null,
      isPlaying: false,
      position: 0,
      lastUpdateAt: Date.now(),
      viewers: new Map<string, ViewerState>(),
    };
  }

  private serializeState(state: RoomState): SerializableRoomState {
    return {
      ...state,
      viewers: Array.from(state.viewers.entries()),
    };
  }

  private deserializeState(state: SerializableRoomState): RoomState {
    return {
      ...state,
      viewers: new Map(state.viewers),
    };
  }

  private async persistState() {
    await this.room.storage.put(STORAGE_KEY, this.serializeState(this.state));
  }

  private async clearRoomState(options: { markEnded: boolean }) {
    this.state = this.createDefaultState();
    await this.room.storage.deleteAlarm();
    await this.room.storage.delete(STORAGE_KEY);

    if (options.markEnded) {
      await this.room.storage.put(ROOM_ENDED_KEY, Date.now());
      return;
    }

    await this.room.storage.delete(ROOM_ENDED_KEY);
  }

  private async endRoom() {
    this.room.broadcast(JSON.stringify({ type: "room-ended" } satisfies ServerMessage));
    await this.clearRoomState({ markEnded: true });

    for (const connection of this.room.getConnections<ConnectionMeta>()) {
      connection.close(4401, "Room ended by host");
    }
  }

  private markViewer(connectionId: string, authed: boolean) {
    const existing = this.state.viewers.get(connectionId);
    this.state.viewers.set(connectionId, {
      joinedAt: existing?.joinedAt ?? Date.now(),
      authed,
    });
  }

  private ensureHost(connectionId: string) {
    if (!this.state.hostConnectionId) {
      this.state.hostConnectionId = connectionId;
    }

    return this.state.hostConnectionId === connectionId;
  }

  private findNextHostId() {
    const next = Array.from(this.state.viewers.entries())
      .sort(([, a], [, b]) => a.joinedAt - b.joinedAt)
      .find(([, viewer]) => viewer.authed);

    return next?.[0] ?? null;
  }

  private broadcastViewerCount() {
    this.room.broadcast(
      JSON.stringify({ type: "viewer-count", count: this.state.viewers.size } satisfies ServerMessage),
    );
  }

  private broadcastHostChanged() {
    this.room.broadcast(
      JSON.stringify({ type: "host-changed", connectionId: this.state.hostConnectionId } satisfies ServerMessage),
    );
  }

  private sendSync(conn: Connection<ConnectionMeta>, isHost: boolean) {
    conn.send(
      JSON.stringify({
        type: "sync",
        roomId: this.state.roomId,
        videoUrl: this.state.videoUrl,
        videoType: this.state.videoType,
        position: this.state.position,
        isPlaying: this.state.isPlaying,
        viewers: this.state.viewers.size,
        isHost,
        connectionId: conn.id,
      } satisfies ServerMessage),
    );
  }

  private sendAuthOk(conn: Connection<ConnectionMeta>, isHost: boolean) {
    conn.setState({ authed: true });
    conn.send(JSON.stringify({ type: "auth-ok", isHost, connectionId: conn.id } satisfies ServerMessage));
  }

  private parseMessage(raw: string | ArrayBuffer | ArrayBufferView) {
    if (typeof raw === "string") {
      return safeJsonParse<ClientMessage>(raw);
    }

    if (raw instanceof ArrayBuffer) {
      return safeJsonParse<ClientMessage>(new TextDecoder().decode(raw));
    }

    return safeJsonParse<ClientMessage>(new TextDecoder().decode(raw.buffer));
  }

  private async handlePinAuth(conn: Connection<ConnectionMeta>, pin: string, hostToken: string | null) {
    const failure = this.pinFailures.get(conn.id);
    const now = Date.now();

    if (failure && now - failure.windowStartedAt > 60_000) {
      this.pinFailures.delete(conn.id);
    }

    const currentFailure = this.pinFailures.get(conn.id);
    if (currentFailure && currentFailure.count >= 10) {
      conn.close(4403, "Too many PIN failures");
      return;
    }

    const isValidPin = this.state.pin === pin.trim();
    const canAutoAuthAsCreator = Boolean(hostToken && hostToken === this.state.hostToken);

    if (!isValidPin) {
      const next = {
        count: (currentFailure?.count ?? 0) + 1,
        windowStartedAt: currentFailure?.windowStartedAt ?? now,
      };
      this.pinFailures.set(conn.id, next);

      if (next.count >= 10) {
        conn.close(4403, "Too many PIN failures");
        return;
      }

      conn.send(
        JSON.stringify({
          type: "auth-fail",
          error: next.count >= 5 ? "Too many attempts. Wait and try again." : "Incorrect PIN",
        } satisfies ServerMessage),
      );
      return;
    }

    await this.room.storage.deleteAlarm();
    this.pinFailures.delete(conn.id);
    this.markViewer(conn.id, true);

    if (canAutoAuthAsCreator) {
      conn.setState({ authed: true });
    }

    const resolvedHost = this.ensureHost(conn.id);

    await this.persistState();
    this.sendAuthOk(conn, resolvedHost);
    this.sendSync(conn, resolvedHost);
    this.broadcastViewerCount();
    this.broadcastHostChanged();
  }
}

RoomServer satisfies Worker;

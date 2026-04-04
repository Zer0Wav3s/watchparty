import type * as Party from "partykit/server";
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
const hostTokenId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 16);

type ConnectionMeta = {
  authed: boolean;
};

export default class RoomServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  readonly options = {
    hibernate: true,
  };

  private state: RoomState = this.createDefaultState();
  private pinFailures = new Map<string, { count: number; windowStartedAt: number }>();

  async onStart() {
    const stored = await this.room.storage.get<SerializableRoomState>(STORAGE_KEY);
    this.state = stored ? this.deserializeState(stored) : this.createDefaultState();
  }

  async onConnect(conn: Party.Connection<ConnectionMeta>, ctx: Party.ConnectionContext) {
    await this.ensureStateLoaded();

    if (!this.state.roomId) {
      conn.send(JSON.stringify({ type: "room-not-found" } satisfies ServerMessage));
      conn.close(4404, "Room not found");
      return;
    }

    const requestUrl = new URL(ctx.request.url);
    const hostToken = requestUrl.searchParams.get("hostToken");
    const requiresPin = Boolean(this.state.pin);
    const autoAuthed = !requiresPin || (hostToken && hostToken === this.state.hostToken);

    conn.setState({ authed: autoAuthed });

    if (autoAuthed) {
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

  async onMessage(raw: string | ArrayBuffer | ArrayBufferView, conn: Party.Connection<ConnectionMeta>) {
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

        if (message.type === "seek") {
          this.state.isPlaying = this.state.isPlaying;
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

  async onClose(conn: Party.Connection<ConnectionMeta>) {
    await this.ensureStateLoaded();

    if (this.state.viewers.has(conn.id)) {
      this.state.viewers.delete(conn.id);

      if (this.state.hostConnectionId === conn.id) {
        this.state.hostConnectionId = this.findNextHostId();
      }

      await this.persistState();
      this.broadcastViewerCount();
      this.broadcastHostChanged();
    }
  }

  async onRequest(req: Request) {
    await this.ensureStateLoaded();

    if (req.method === "POST") {
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

      await this.persistState();

      return Response.json({
        ok: true,
        roomId: this.room.id,
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

  private sendSync(conn: Party.Connection<ConnectionMeta>, isHost: boolean) {
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
      } satisfies ServerMessage),
    );
  }

  private sendAuthOk(conn: Party.Connection<ConnectionMeta>, isHost: boolean) {
    conn.setState({ authed: true });
    conn.send(JSON.stringify({ type: "auth-ok", isHost } satisfies ServerMessage));
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

  private async handlePinAuth(conn: Party.Connection<ConnectionMeta>, pin: string, hostToken: string | null) {
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
    const isHost = !this.state.hostConnectionId || hostToken === this.state.hostToken;

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

    this.pinFailures.delete(conn.id);
    this.markViewer(conn.id, true);

    if (isHost && !this.state.hostConnectionId) {
      this.state.hostConnectionId = conn.id;
    }

    await this.persistState();

    const resolvedHost = this.state.hostConnectionId === conn.id;
    this.sendAuthOk(conn, resolvedHost);
    this.sendSync(conn, resolvedHost);
    this.broadcastViewerCount();
    this.broadcastHostChanged();
  }
}

RoomServer satisfies Party.Worker;

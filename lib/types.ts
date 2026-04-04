export type VideoType = "youtube" | "hls" | "mp4";

export interface ViewerState {
  joinedAt: number;
  authed: boolean;
}

export interface RoomState {
  roomId: string;
  pin: string | null;
  hostToken: string | null;
  hostConnectionId: string | null;
  videoUrl: string | null;
  videoType: VideoType | null;
  isPlaying: boolean;
  position: number;
  lastUpdateAt: number;
  viewers: Map<string, ViewerState>;
}

export interface SerializableRoomState {
  roomId: string;
  pin: string | null;
  hostToken: string | null;
  hostConnectionId: string | null;
  videoUrl: string | null;
  videoType: VideoType | null;
  isPlaying: boolean;
  position: number;
  lastUpdateAt: number;
  viewers: Array<[string, ViewerState]>;
}

export type ClientMessage =
  | { type: "pin-auth"; pin: string; hostToken?: string | null }
  | { type: "set-video"; url: string; videoType: VideoType }
  | { type: "play"; position: number }
  | { type: "pause"; position: number }
  | { type: "seek"; position: number }
  | { type: "heartbeat"; position: number }
  | { type: "end-room" };

export type ServerMessage =
  | { type: "pin-required" }
  | { type: "auth-ok"; isHost: boolean; connectionId: string }
  | { type: "auth-fail"; error: string }
  | {
      type: "sync";
      roomId: string;
      videoUrl: string | null;
      videoType: VideoType | null;
      position: number;
      isPlaying: boolean;
      viewers: number;
      isHost: boolean;
      connectionId: string;
    }
  | { type: "viewer-count"; count: number }
  | { type: "host-changed"; connectionId: string | null }
  | {
      type: "video-change";
      url: string | null;
      videoType: VideoType | null;
      position: number;
      isPlaying: boolean;
    }
  | { type: "play"; position: number }
  | { type: "pause"; position: number }
  | { type: "seek"; position: number }
  | { type: "heartbeat"; position: number }
  | { type: "room-ended" }
  | { type: "room-not-found" }
  | { type: "error"; error: string; candidates?: string[] };

export interface ExtractResult {
  src: string;
  type: Exclude<VideoType, "youtube">;
  candidates?: string[];
}

export interface ExtractError {
  error: string;
  candidates?: string[];
}

export interface PartyInitResponse {
  ok: boolean;
  roomId: string;
  hostToken: string | null;
}

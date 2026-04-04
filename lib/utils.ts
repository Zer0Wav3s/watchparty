import { customAlphabet } from "nanoid";

const roomId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 8);

const YOUTUBE_HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"];

export function generateRoomId() {
  return roomId();
}

export function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeUrl(value: string) {
  if (!value) {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function isYouTubeUrl(value: string) {
  if (!isValidHttpUrl(value)) {
    return false;
  }

  const url = new URL(value);
  return YOUTUBE_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
}

export function inferVideoType(url: string) {
  const normalized = url.toLowerCase();

  if (normalized.includes(".m3u8")) {
    return "hls" as const;
  }

  if (normalized.includes(".mp4")) {
    return "mp4" as const;
  }

  return null;
}

export function getClientIp(forwardedFor: string | null) {
  if (!forwardedFor) {
    return "unknown";
  }

  return forwardedFor.split(",")[0]?.trim() || "unknown";
}

export function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

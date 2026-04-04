import { NextRequest } from "next/server";

import { extractVideo } from "@/lib/extractVideo";
import { getClientIp, isValidHttpUrl, normalizeUrl } from "@/lib/utils";

const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;

const ipRequests = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRequests.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    ipRequests.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers.get("x-forwarded-for"));

  if (!checkRateLimit(ip)) {
    return Response.json({ error: "Rate limit exceeded. Try again in a minute." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as { url?: string } | null;

  if (!body?.url) {
    return Response.json({ error: "Missing url in request body" }, { status: 400 });
  }

  const url = normalizeUrl(body.url);

  if (!isValidHttpUrl(url)) {
    return Response.json({ error: "Invalid URL" }, { status: 400 });
  }

  const result = await extractVideo(url);

  if ("error" in result) {
    return Response.json(result, { status: 422 });
  }

  return Response.json(result);
}

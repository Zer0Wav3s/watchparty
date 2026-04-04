import { NextRequest } from "next/server";

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";


export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return new Response("Missing url parameter", { status: 400 });
  }

  try {
    new URL(url);
  } catch {
    return new Response("Invalid URL", { status: 400 });
  }

  try {
    const origin = new URL(url).origin;
    const response = await fetch(url, {
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "*/*",
        Referer: origin + "/",
        Origin: origin,
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      return new Response(`Upstream returned ${response.status}`, { status: 502 });
    }

    const contentType = response.headers.get("content-type") ?? "application/octet-stream";
    const body = response.body;

    if (!body) {
      return new Response("Empty upstream response", { status: 502 });
    }

    // For m3u8 playlists, rewrite segment URLs to also go through the proxy
    if (contentType.includes("mpegurl") || url.toLowerCase().includes("m3u8")) {
      const text = await response.text();
      const baseUrl = url.substring(0, url.lastIndexOf("/") + 1);

      const rewritten = text.replace(/^(?!#)(.+)$/gm, (line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return line;

        // Make relative URLs absolute
        const absoluteUrl = trimmed.startsWith("http") ? trimmed : baseUrl + trimmed;
        return `/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
      });

      return new Response(rewritten, {
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache",
        },
      });
    }

    // For video segments, stream them through
    return new Response(body, {
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("Failed to fetch upstream resource", { status: 502 });
  }
}

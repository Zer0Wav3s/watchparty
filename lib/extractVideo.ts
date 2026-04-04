import * as cheerio from "cheerio";

import type { ExtractError, ExtractResult } from "@/lib/types";

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const HLS_REGEX = /https?:\/\/[^\s"'<>]+?\.m3u8[^\s"'<>]*/gi;
const MP4_REGEX = /https?:\/\/[^\s"'<>]+?\.mp4[^\s"'<>]*/gi;
const VIDEO_KEY_REGEX = /["'](file|src|source|url|video_url|videoUrl|streamUrl)["']\s*:\s*["'](https?:\/\/[^\s"']+\.(?:m3u8|mp4)[^\s"']*)["']/gi;

function inferType(url: string): "hls" | "mp4" {
  return url.toLowerCase().includes(".m3u8") ? "hls" : "mp4";
}

function dedup(urls: string[]): string[] {
  return [...new Set(urls)];
}

async function validateCandidate(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": BROWSER_UA },
      redirect: "follow",
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) return false;

    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    return (
      contentType.includes("video") ||
      contentType.includes("mpegurl") ||
      contentType.includes("octet-stream") ||
      contentType.includes("mp4") ||
      contentType.includes("mp2t")
    );
  } catch {
    return false;
  }
}

function extractFromHtml(html: string): string[] {
  const $ = cheerio.load(html);
  const candidates: string[] = [];

  // <source> tags
  $("source[src]").each((_, el) => {
    const src = $(el).attr("src");
    if (src && (src.includes(".m3u8") || src.includes(".mp4"))) {
      candidates.push(src);
    }
  });

  // <video> tags
  $("video[src]").each((_, el) => {
    const src = $(el).attr("src");
    if (src && (src.includes(".m3u8") || src.includes(".mp4"))) {
      candidates.push(src);
    }
  });

  // Regex scan for HLS
  const hlsMatches = html.match(HLS_REGEX);
  if (hlsMatches) candidates.push(...hlsMatches);

  // Regex scan for MP4
  const mp4Matches = html.match(MP4_REGEX);
  if (mp4Matches) candidates.push(...mp4Matches);

  // JSON keys in <script> tags
  let keyMatch;
  while ((keyMatch = VIDEO_KEY_REGEX.exec(html)) !== null) {
    if (keyMatch[2]) candidates.push(keyMatch[2]);
  }

  return dedup(candidates);
}

function extractIframeSrcs(html: string): string[] {
  const $ = cheerio.load(html);
  const srcs: string[] = [];
  $("iframe[src]").each((_, el) => {
    const src = $(el).attr("src");
    if (src && src.startsWith("http")) srcs.push(src);
  });
  return srcs;
}

export async function extractVideo(url: string): Promise<ExtractResult | ExtractError> {
  try {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes(".m3u8")) {
      return { src: url, type: "hls" };
    }
    if (lowerUrl.includes(".mp4")) {
      return { src: url, type: "mp4" };
    }

    let html: string;
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": BROWSER_UA },
        redirect: "follow",
        signal: AbortSignal.timeout(12_000),
      });

      if (!response.ok) {
        return {
          error: `Failed to fetch the page (${response.status}). The site may be blocking requests.`,
          candidates: [],
        };
      }

      html = await response.text();
    } catch {
      return {
        error: "Failed to fetch the page. The site may be blocking requests.",
        candidates: [],
      };
    }

    let candidates = extractFromHtml(html);

    if (candidates.length === 0) {
      const iframeSrcs = extractIframeSrcs(html);

      for (const iframeSrc of iframeSrcs.slice(0, 3)) {
        try {
          const iframeResponse = await fetch(iframeSrc, {
            headers: { "User-Agent": BROWSER_UA },
            redirect: "follow",
            signal: AbortSignal.timeout(8_000),
          });

          if (!iframeResponse.ok) {
            continue;
          }

          const iframeHtml = await iframeResponse.text();
          candidates.push(...extractFromHtml(iframeHtml));
        } catch {
          // Skip iframe failures and keep trying the remaining candidates.
        }
      }

      candidates = dedup(candidates);
    }

    if (candidates.length === 0) {
      return { error: "Could not extract video source", candidates: [] };
    }

    for (const candidate of candidates) {
      const valid = await validateCandidate(candidate);
      if (valid) {
        return { src: candidate, type: inferType(candidate) };
      }
    }

    return { error: "Could not extract video source", candidates };
  } catch {
    return {
      error: "Unexpected extraction failure while parsing the source page.",
      candidates: [],
    };
  }
}

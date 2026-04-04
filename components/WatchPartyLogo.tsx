"use client";

import Link from "next/link";

interface WatchPartyLogoProps {
  size?: 32 | 64;
  linkTo?: string;
}

export function WatchPartyLogo({ size = 64, linkTo }: WatchPartyLogoProps) {
  const fontSize = size === 32 ? "1.75rem" : "3.5rem";

  const emoji = (
    <span
      role="img"
      aria-label="WatchParty"
      style={{ fontSize, lineHeight: 1, display: "inline-block" }}
    >
      🎉
    </span>
  );

  if (linkTo) {
    return (
      <Link
        href={linkTo}
        aria-label="Back to home"
        className="cursor-pointer transition-transform duration-200 ease-out hover:scale-110"
      >
        {emoji}
      </Link>
    );
  }

  return emoji;
}

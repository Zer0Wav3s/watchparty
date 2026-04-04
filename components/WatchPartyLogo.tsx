"use client";

import Link from "next/link";

import { useTheme } from "@/app/providers";

interface WatchPartyLogoProps {
  size?: 32 | 64;
  linkTo?: string;
}

export function WatchPartyLogo({ size = 64, linkTo }: WatchPartyLogoProps) {
  const { theme } = useTheme();
  const color = theme === "dark" ? "#A78BFA" : "#8B5CF6";

  const svg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Rounded play button shape */}
      <rect x="4" y="4" width="56" height="56" rx="16" fill={color} />
      {/* Play triangle */}
      <path
        d="M26 20L44 32L26 44V20Z"
        fill="white"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (linkTo) {
    return (
      <Link
        href={linkTo}
        aria-label="Back to home"
        className="cursor-pointer transition-transform duration-200 ease-out hover:scale-105"
      >
        {svg}
      </Link>
    );
  }

  return svg;
}

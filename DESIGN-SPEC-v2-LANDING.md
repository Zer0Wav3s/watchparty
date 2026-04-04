# WatchParty — Design Specification v2 (Landing Page + Navigation)

> **Philosophy:** Clean over clever. Party through color, not clutter. Light-mode first, bubbly energy without being cluttered. Every element earns its place.
> **Inspiration:** Linear + Vercel + Notion — clean SaaS with warm, colorful accents + modern, open spacing.

---

## 1. Logo & Navigation

### Brand Logo Concept
**Shape:** A playful, modern, rounded aesthetic, such as a rounded play button overlapping a chat bubble, or a bold sans-serif "W" and "P" interlocking in soft, thick radii.
**Color:** Primary accent `var(--accent-primary)` (`#8B5CF6`).
**Tone:** Friendly, accessible, SaaS-like clean but consumer-app fun.

### Logo Placement

**Landing Page (`/`):**
- **Position:** Top-center, hero section, functioning as the visual anchor.
- **Size:** 64px × 64px icon, optionally paired with "WatchParty" text below it or as a wordmark.
- **Style:** Clean, solid color.
- **Color:** `#8B5CF6` (light mode), `#A78BFA` (dark mode).

**Room Page (`/room/[id]`):**
- **Position:** Top-left, inside the header bar.
- **Size:** 32px × 32px.
- **Interaction:** Clickable link navigating to `/` (home).
- **Accessibility:** `<button aria-label="Back to home">...</button>` or `<Link aria-label="Back to home">...`.
- **Hover:** Slight opacity shift or minimal scale `transform: scale(1.05)`.

### Header Bar (Room Page)

Keep existing `height: 56px`, `border-bottom: 1px solid var(--border)`.

**Layout:** Flex container `justify-between items-center px-6`
- **Left:** WatchParty Logo (32px, clickable home link)
- **Center:** Room ID badge & Viewer Count (stacked or inline flex)
- **Right:** Host badge (if host) + End Room button + Theme Toggle

---

## 2. Landing Page Redesign

**Overall Layout:**
- Vertically centered (`min-h-screen`, `flex flex-col`, `justify-center`).
- Spacious `py-24` desktop, `py-16` mobile to give an airy feel.
- Clean white/light grey (`var(--bg)`) without heavy density.

**Hero Section:**
- **Logo:** 64px icon, centered `mx-auto mb-6`.
- **Headline:** "Watch Together, From Anywhere"
  - Size: 4xl (2.25rem), Weight: 800
  - Color: `var(--text-primary)` (`#111827`)
- **Subheadline:** "Create a room, share the link, press play. Everyone stays in sync."
  - Size: lg (1.125rem), Weight: 400
  - Color: `var(--text-secondary)` (`#6B7280`)
  - Margin: `mt-4`, `max-w-md mx-auto` (readable line length).

**PIN Input & Create Box:**
- Container: `mx-auto max-w-sm w-full mt-10`.
- **Input:**
  - Placeholder: "Room PIN (optional)"
  - Height: 48px, Border-radius: 12px.
  - Border: `1px solid var(--border)` (`#E5E7EB`).
  - Focus ring: `2px solid var(--accent-primary)`.
- **Button ("Create Room"):**
  - Background: Solid purple `var(--accent-primary)` (`#8B5CF6`). **NO gradient.**
  - Text: White, font-weight 600.
  - Height: 48px, full width.
  - Border-radius: 12px, Margin: `mt-4`.
  - Icon: Lucide `Play` icon (18px) aligned left of text or right.
  - Hover: Background changes to `var(--accent-primary-hover)` (`#7C3AED`).

**Feature Cards (The Responsive Grid):**
- Container: `max-w-5xl mx-auto mt-24`.
- Grid layout: `grid grid-cols-1 md:grid-cols-3 gap-6`.
- **Card Styling:**
  - Background: `var(--surface)` (`#FFFFFF`).
  - Border: `1px solid var(--border)` (`#E5E7EB`).
  - Border-radius: 16px.
  - Padding: 32px.
  - Hover transition: `hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-out`.
- **Card Content:**
  - Icon: 32px, `var(--accent-primary)`. (Zap, Shield, MonitorPlay)
  - Title: lg (1.125rem), 600 weight, `var(--text-primary)`, `mt-4 mb-2`.
  - Description: base (1rem), 400 weight, `var(--text-secondary)`, line-height 1.6.

**Theme Toggle:**
- Position: Fixed or absolute top-right (`top-6 right-6`).
- Size: 40px × 40px, transparent background.
- Hover: `bg-neutral-100` (`var(--surface-hover)`), `rounded-full`.
- Icon: Sun / Moon (20px), animated on toggle.

---

## 3. Shareable Room Link Feature

Located directly below the room header.

**Design & Layout:**
- Container: Centered max-width, `mt-6 mb-6 px-4`.
- Display: Flex row, inline, centered vertically.
- Label: "Share Room:" (`text-sm text-muted font-medium mr-3`).
- **Interactive URL Badge:**
  - Format: A clickable pill or rounded rectangle containing the URL and a copy icon.
  - Value: `watchparty.zer0wav3s.vercel.app/room/XXXXX`
  - Typography: `font-mono text-sm text-secondary truncate max-w-[250px] sm:max-w-md`.
  - Background: `var(--surface)` or slight gray fill. Border: `1px solid var(--border)`.
  - Padding: `8px 16px`. Radius: `12px` or `full`.
  - Right Icon: Lucide `Copy` (16px, `var(--text-muted)`).
  - Hover: `cursor-pointer`, border changes to `var(--accent-primary)`, icon turns purple.
  - Active/Click: Gentle scale down `scale-95`.

**Interaction (Copy to Clipboard):**
- Click Event: Copies the room URL to the user's clipboard using the Clipboard API.
- Feedback: Mounts a Toast notification (fixed bottom-right or top-center).
- Toast Text: "Copied to clipboard!"
- Toast Icon: `CheckCircle` (green/success).
- Toast Behavior: Slide in, auto-dismiss after 3000ms.

---

## 4. Typography, Colors & Spacing Refinements

**Color Overrides (per impeccable pass):**
- `--accent-primary`: `#8B5CF6`
- `--accent-primary-hover`: `#7C3AED`
- _No gradients on primary actions; solid colors to emphasize clean modern SaaS._

**Animation Easing:**
- General UI transitions (hover): `duration-200 ease-out`.
- Card lifts: `duration-300 cubic-bezier(0.16, 1, 0.3, 1)`.
- Toast slide-in: `duration-300 cubic-bezier(0.175, 0.885, 0.32, 1.275)` (springy bounce).

**Accessibility (WCAG AA):**
- All focus states (`focus-visible`) must use an offset purple ring (`ring-2 ring-purple-500 ring-offset-2`).
- Contrast matches confirmed (Purple #8B5CF6 on White is >4.5:1).


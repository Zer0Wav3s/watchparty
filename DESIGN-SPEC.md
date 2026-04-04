# WatchParty — Design Specification v1

> **Philosophy:** Clean over clever. Party through color, not clutter. Every element earns its place.
> **Inspiration:** Linear + Vercel + Notion — clean SaaS with warm, colorful accents.

---

## 1. Color System

### Light Mode (Default)

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#F8F9FC` | Page background |
| `--bg-gradient-from` | `#EEF0FF` | Background gradient start (top) |
| `--bg-gradient-to` | `#FDF2F8` | Background gradient end (bottom) |
| `--surface` | `#FFFFFF` | Cards, modals, inputs |
| `--surface-hover` | `#F9FAFB` | Card hover state |
| `--text-primary` | `#111827` | Headlines, primary text |
| `--text-secondary` | `#6B7280` | Subtext, descriptions |
| `--text-muted` | `#9CA3AF` | Placeholders, disabled |
| `--border` | `#E5E7EB` | Card borders, input borders |
| `--border-focus` | `#A78BFA` | Focus rings |
| `--accent-primary` | `#8B5CF6` | Primary buttons, links |
| `--accent-primary-hover` | `#7C3AED` | Primary hover |
| `--accent-secondary` | `#EC4899` | Secondary accent (pink) |
| `--success` | `#10B981` | Success states |
| `--danger` | `#EF4444` | Danger/destructive |
| `--danger-hover` | `#DC2626` | Danger hover |

**Button Gradient:** `linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)`
**Button Gradient Hover:** `linear-gradient(135deg, #7C3AED 0%, #DB2777 100%)`

### Dark Mode

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#0F1117` | Page background |
| `--bg-gradient-from` | `#0F1117` | No gradient in dark |
| `--bg-gradient-to` | `#0F1117` | Solid dark |
| `--surface` | `#1A1D2E` | Cards |
| `--surface-hover` | `#242840` | Card hover |
| `--text-primary` | `#F9FAFB` | Headlines |
| `--text-secondary` | `#9CA3AF` | Subtext |
| `--text-muted` | `#6B7280` | Placeholders |
| `--border` | `#2D3148` | Borders |
| `--border-focus` | `#A78BFA` | Focus rings (same) |
| `--accent-primary` | `#A78BFA` | Slightly lighter purple |
| `--accent-primary-hover` | `#8B5CF6` | Hover |
| `--accent-secondary` | `#F472B6` | Pink accent |
| `--success` | `#34D399` | Success |
| `--danger` | `#F87171` | Danger |
| `--danger-hover` | `#EF4444` | Danger hover |

---

## 2. Typography

**Font:** `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

| Scale | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `4xl` | `2.25rem` (36px) | 800 (extrabold) | 1.2 | Landing headline |
| `2xl` | `1.5rem` (24px) | 700 (bold) | 1.3 | Room page title |
| `xl` | `1.25rem` (20px) | 600 (semibold) | 1.4 | Feature card titles |
| `lg` | `1.125rem` (18px) | 400 (normal) | 1.5 | Landing subheadline |
| `base` | `1rem` (16px) | 400 (normal) | 1.5 | Body text, inputs |
| `sm` | `0.875rem` (14px) | 500 (medium) | 1.5 | Labels, badges, descriptions |
| `xs` | `0.75rem` (12px) | 500 (medium) | 1.5 | Captions, footnotes |

---

## 3. Spacing & Radii

| Element | Border Radius |
|---------|---------------|
| Cards | `16px` |
| Buttons | `12px` |
| Inputs | `12px` |
| Badges | `9999px` (pill) |
| Video area | `12px` |

| Spacing Token | Value | Usage |
|---------------|-------|-------|
| Page padding | `24px` (mobile), `48px` (desktop) | Outer page margins |
| Card padding | `32px` | Internal card padding |
| Section gap | `24px` | Between sections |
| Element gap | `12px` | Between form elements |
| Button height | `48px` | All primary buttons |
| Input height | `48px` | All text inputs |

---

## 4. Component Specifications

### 4A. Landing Page (`app/page.tsx`)

**Layout:** Single column, centered. `max-w-lg` (512px). Vertically centered (`min-h-dvh`, `items-center`, `justify-center`).

**Background:**
- Light: `linear-gradient(180deg, #EEF0FF 0%, #FDF2F8 100%)`
- Dark: solid `#0F1117`

**Card:**
- Background: `--surface` (white / dark surface)
- Border: `1px solid --border`
- Shadow: `0 1px 3px rgba(0,0,0,0.05)` (light), `none` (dark)
- Border-radius: `16px`
- Padding: `32px`

**Headline:**
- Text: `"Watch together, from anywhere."`
- Size: `4xl` (2.25rem), weight 800
- Color: `--text-primary`
- Centered

**Subheadline:**
- Text: `"Create a room, share the link, press play. Everyone stays in sync."`
- Size: `lg` (1.125rem), weight 400
- Color: `--text-secondary`
- Centered, `max-w-sm`, `mt-2`

**PIN Input:**
- Height: `48px`
- Background: `--surface`
- Border: `1px solid --border`
- Border-radius: `12px`
- Placeholder: `"Room PIN (optional)"` in `--text-muted`
- Focus: `ring-2 ring-[--border-focus]`
- Icon: `LockKeyhole` from Lucide, 16px, `--text-muted`, positioned left with `pl-10`

**Create Room Button:**
- Height: `48px`
- Full width (`w-full`)
- Background: button gradient
- Text: `"Create Room"`, white, weight 700, `base` size
- Border-radius: `12px`
- Hover: gradient shifts to hover variant + `scale(1.02)` + `box-shadow: 0 4px 16px rgba(139,92,246,0.3)`
- Active: `scale(0.98)`
- Icon: `Play` from Lucide, 18px, white, left of text

**Feature Section (below card):**
- Layout: `flex gap-8 mt-8`, centered
- 3 features, each: icon (24px, `--accent-primary`) + label (`sm`, `--text-secondary`)
- Features:
  1. `Zap` icon + "Instant sync"
  2. `Shield` icon + "PIN protection"
  3. `MonitorPlay` icon + "YouTube & HLS"
- No cards around features. Just icon + text, minimal.

**Theme Toggle:**
- Position: absolute top-right of page, `top-6 right-6`
- Button: `40px × 40px`, ghost style (transparent bg)
- Icon: `Sun` (in light mode) / `Moon` (in dark mode), 20px
- Hover: `--surface-hover` background, `border-radius: 9999px`
- Click: icon rotates 180° over 300ms

**Footer:**
- Text: `"WatchParty"` in `xs`, `--text-muted`, centered, `mt-8`

### 4B. Room Page (`app/room/[id]/page.tsx`)

**Layout:** Full width. No sidebar. Stacked vertically.

**Header Bar:**
- Height: `56px`
- Background: `--surface`
- Border-bottom: `1px solid --border`
- Padding: `0 24px`
- Content (flex, space-between):
  - Left: Room ID badge (pill, `--bg`, `--text-secondary`, `sm` font) + Viewer count (`Users` icon 16px + count, `sm`, `--text-secondary`)
  - Center: (empty)
  - Right: Host badge (if host) + End Room button (if host) + Theme toggle

**Host Badge:**
- `Crown` icon 14px + "Host" text
- Background: `#FEF3C7` (amber-100) | Dark: `#78350F` with `#FDE68A` text
- Text: `#92400E` (amber-800), `xs`, weight 600
- Border-radius: pill
- Padding: `4px 10px`

**End Room Button (host only):**
- Text: `"End Room"`
- Style: danger variant — `--danger` bg, white text, `sm` font, weight 600
- Height: `32px`, border-radius: `8px`, padding: `0 12px`
- Hover: `--danger-hover`
- Icon: `LogOut` 14px, white, left of text

**Video Area:**
- Max-width: `960px`, centered
- Aspect ratio: `16/9`
- Background (empty): `--surface`
- Border: `1px solid --border`
- Border-radius: `12px`
- Overflow: hidden

**Empty State (no video loaded):**
- Centered in video area
- `CirclePlay` icon, 64px, `--text-muted`
- Text: `"Paste a link below to start watching"`, `lg`, `--text-secondary`
- Subtext: `"YouTube, HLS streams, and direct video links supported"`, `sm`, `--text-muted`

**URL Input Bar:**
- Below video area, `mt-4`
- Same max-width as video (960px), centered
- Flex row: Input (flex-1) + Button
- Input: same style as landing page input, icon `Link2` left
- Placeholder (host): `"Paste a video link..."` 
- Placeholder (non-host): `"Waiting for host to choose a video"`
- Button: `"Load"`, primary gradient, `48px` height, `80px` width, border-radius `12px`
- Non-host: input + button disabled, `opacity-50`

**Viewer Count:**
- `Users` icon 16px + count number
- `sm` font, `--text-secondary`

**Toast Notifications:**
- Position: top-center, `top-4`
- Background: `--surface`, border: `1px solid --border`
- Shadow: `0 4px 12px rgba(0,0,0,0.1)`
- Border-radius: `12px`
- Padding: `12px 16px`
- Text: `sm`, `--text-primary`
- Animation: slide down from -20px, fade in, 300ms ease-out
- Auto-dismiss: 3 seconds, fade out 200ms

**Room Ended Overlay:**
- Full-screen overlay, `bg-black/50` backdrop
- Centered card: `--surface`, `16px` radius, `32px` padding
- `PartyPopper` icon 48px, `--accent-primary`
- Text: `"This room has ended"`, `xl`, weight 600
- Subtext: `"Redirecting to home..."`, `sm`, `--text-secondary`
- Redirect after 3 seconds

---

## 5. Animations (framer-motion)

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Card entrance | `opacity: 0→1, y: 16→0` | `500ms` | `[0.16, 1, 0.3, 1]` (ease-out) |
| Button hover | `scale: 1.02` | `150ms` | `ease-out` |
| Button active | `scale: 0.98` | `100ms` | `ease-out` |
| Theme toggle icon | `rotate: 0→180` | `300ms` | `spring(stiffness:200)` |
| Toast enter | `opacity: 0→1, y: -20→0` | `300ms` | `ease-out` |
| Toast exit | `opacity: 1→0` | `200ms` | `ease-in` |
| Page transition | `opacity: 0→1` | `300ms` | `ease-out` |

**NO confetti particles. NO orbiting icons. NO floating elements.** Animations are subtle and functional.

---

## 6. Dark Mode Behavior

- Toggle in top-right corner on all pages
- Theme stored in `localStorage` key: `watchparty-theme`
- Values: `"light"` | `"dark"`
- Default: `"light"`
- Applied via `class="dark"` on `<html>` element
- Tailwind dark mode: `darkMode: "class"`
- Transition: `transition-colors duration-200` on `<body>` for smooth switch
- NO flash on page load: script in `<head>` reads localStorage and sets class before paint

---

## 7. What to REMOVE from current codebase

1. ❌ "WatchParty MVP" badge — delete entirely
2. ❌ Orbiting icons / "LIVE ROOM ENERGY" visualization — delete entirely  
3. ❌ Duplicate "Create Room" button — ONE button only
4. ❌ Dark gray card backgrounds in light mode — use white
5. ❌ Fuchsia-400 accent color — replace with the purple/pink from this spec
6. ❌ `slate-950` background — replace with gradient (light) or `#0F1117` (dark)
7. ❌ Any remaining "MVP" text anywhere
8. ❌ `.tmp-pr-body.md` and `.tmp-pr-body.json` — delete these build artifacts

---

## 8. Files to Create/Modify

| File | Action |
|------|--------|
| `app/globals.css` | CSS custom properties for all tokens, dark mode overrides |
| `app/layout.tsx` | Theme script in `<head>`, dark class logic |
| `app/providers.tsx` | ThemeContext with localStorage sync |
| `app/page.tsx` | Complete rewrite per spec |
| `app/room/[id]/page.tsx` | Rewrite header, empty state, layout per spec |
| `components/ThemeToggle.tsx` | Sun/Moon toggle per spec |
| `components/UrlInput.tsx` | Match spec styling |
| `components/VideoPlayer.tsx` | Ensure border-radius, dark mode |
| `components/ViewerCount.tsx` | Icon + count per spec |
| `components/PinGate.tsx` | Match input/button spec |
| `components/Toast.tsx` | NEW — toast notification component |
| `tailwind.config.ts` | Extend with custom colors if needed, `darkMode: "class"` |
| `.tmp-pr-body.md` | DELETE |
| `.tmp-pr-body.json` | DELETE |

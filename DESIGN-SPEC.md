# WatchParty Design Specification

## Overarching Philosophy
- **Clean over clever.** Simple layouts, generous whitespace, clear visual hierarchy.
- **Light and airy default.** White/off-white surfaces, soft colored accents.
- **Party through color, not clutter.** Background gradients and colorful buttons bring the energy, while the layout remains structured and minimal. 
- **Inspiration:** Linear, Vercel, Notion. Sharp utility layered with warm, playful interactions.

---

## 1. Color System

### Light Mode Palette
*   **Background:** `#FAFAFA` (neutral-50) layered with a soft radial pastel gradient.
*   **Surface (Cards/Modals):** `#FFFFFF` (pure white) with a translucent backdrop blur.
*   **Text Primary:** `#0F172A` (slate-950)
*   **Text Secondary:** `#64748B` (slate-500)
*   **Border:** `#E2E8F0` (slate-200)
*   **Accent Primary (Button Base):** `#0F172A` (slate-950) for stark contrast, paired with gradient hovers.
*   **Accent Secondary (Highlights):** `#8B5CF6` (violet-500)
*   **Success:** `#10B981` (emerald-500)
*   **Danger (End Room):** `#EF4444` (red-500)
*   **Danger Surface:** `#FEF2F2` (red-50)

### Dark Mode Palette (Cinematic/Theater Vibe)
*   **Background:** `#020617` (slate-950)
*   **Surface:** `#0F172A` (slate-900)
*   **Text Primary:** `#F8FAFC` (slate-50)
*   **Text Secondary:** `#94A3B8` (slate-400)
*   **Border:** `#1E293B` (slate-800)
*   **Accent Primary:** `#F8FAFC` (slate-50)
*   **Danger Surface:** `#450A0A` (red-950/50)

### Gradients
*   **Light Background Gradient (globals.css body):** Soft pastels over `#FAFAFA`. `radial-gradient(circle at top right, rgba(244, 114, 182, 0.08), transparent 40%), radial-gradient(circle at bottom left, rgba(45, 212, 191, 0.08), transparent 40%)`.
*   **Dark Background Gradient:** `radial-gradient(circle at top right, rgba(236, 72, 153, 0.1), transparent 40%), radial-gradient(circle at bottom left, rgba(20, 184, 166, 0.1), transparent 40%)`.
*   **Party Gradient (Text/Accents):** `linear-gradient(135deg, #EC4899 0%, #8B5CF6 50%, #14B8A6 100%)`.

---

## 2. Typography

*   **Font Family:** `var(--font-geist-sans)` (Inter/Geist) for UI; `var(--font-geist-mono)` for Room IDs.
*   **Scale:**
    *   **xs:** `0.75rem` (12px) | Line Height: `1rem`
    *   **sm:** `0.875rem` (14px) | Line Height: `1.25rem`
    *   **base:** `1rem` (16px) | Line Height: `1.5rem`
    *   **lg:** `1.125rem` (18px) | Line Height: `1.75rem`
    *   **xl:** `1.25rem` (20px) | Line Height: `1.75rem`
    *   **2xl:** `1.5rem` (24px) | Line Height: `2rem`
    *   **3xl:** `1.875rem` (30px) | Line Height: `2.25rem`
    *   **4xl:** `2.25rem` (36px) | Line Height: `2.5rem`
    *   **5xl (Hero):** `3rem` (48px) | Line Height: `1.1`
*   **Weights:**
    *   Normal: `400`
    *   Medium: `500` (Use for secondary text/labels)
    *   Semibold: `600` (Use for standard buttons, card titles)
    *   Bold: `700` (Use for section headers)
    *   Black: `900` (Use ONLY for the Hero Headline in marketing)

---

## 3. Spacing & Layout

### Global Radii
*   **Cards:** `16px` (rounded-2xl)
*   **Buttons/Inputs:** `8px` (rounded-lg) for standard, `9999px` (rounded-full) for primary CTAs and Badges.
*   **Video Player:** `16px` (rounded-2xl)

### Landing Page Layout
*   **Structure:** Single column, vertically centered. `max-w-3xl` mx-auto.
*   **Padding:** `px-6 py-16` on mobile, `px-8 py-24` on desktop.
*   **Alignment:** Text centered. Form centered.
*   *(Remove the two-column layout and the cluttered orbiting icons panel).*

### Room Page Layout
*   **Structure:** Video-first hierarchy. Top fixed header, center video, bottom controls.
*   **Header:** `h-16`, flex row, justified between.
*   **Video Container:** `aspect-video`, `w-full max-w-5xl mx-auto`, with subtle shadow `shadow-lg`.
*   **URL Input:** Placed directly beneath the video container, `max-w-2xl mx-auto`.

---

## 4. Component Specs

### Landing Page (`app/page.tsx`)
*   **Hero Headline:** 5xl, text-slate-950 (dark: text-white), Black weight. "Watch together, from anywhere." The words "from anywhere" use bg-clip-text with the Party Gradient.
*   **Subheadline:** lg, text-slate-600, Medium weight, max-w-xl mx-auto.
*   **Form:** Stacked vertically, centered.
*   **PIN Input:** Height `56px` (h-14), `rounded-full`, border `slate-200`, text-center placeholder.
*   **Create Room Button:** ONE CTA. Height `56px` (h-14), `rounded-full`, px-8. Background: `#0F172A`. Text color: `#FFFFFF`. Font: Semibold, Base size. Hover: Add a subtle translateY(-1px) and a party-colored drop shadow `shadow-[0_4px_14px_0_rgba(139,92,246,0.39)]`.
*   **Feature List:** A simple 3-column flex/grid below the fold. Icons are `w-5 h-5` text-slate-600. Title is `sm` Semibold. Description is `sm` text-slate-500. NO cards, just floating text.

### Room Page (`app/room/[id]/page.tsx`)
*   **Header Bar:** `bg-white/80` (backdrop-blur-md). Includes: Room ID (`font-mono`, `text-sm`, `font-semibold`), Theme Toggle (right), Viewer Count, and End Room button (if host).
*   **Host Badge:** `bg-violet-100` (dark: bg-violet-900/30), `text-violet-700` (dark: text-violet-300), `rounded-full`. Crown icon `w-3 h-3`.
*   **Viewer Count:** `text-slate-600`, `text-sm`, `font-medium`. Users icon `w-4 h-4`.
*   **Video Empty State:** When no video is present, the video area has `bg-slate-100` (dark: bg-slate-900). Centered massive Play icon (`text-slate-300`, `w-16 h-16`) and text "Waiting for the host to drop a link..." (`text-slate-500`, `text-sm`).
*   **Bottom URL Bar (Host only):** `h-14` input, border `slate-200`. Button attached to right side or inside input.

### Shared UI Components
*   **Button Variants:**
    *   *Primary:* `bg-slate-950 text-white rounded-full`.
    *   *Secondary:* `bg-white border border-slate-200 text-slate-900 rounded-full`.
    *   *Danger:* `bg-red-500 text-white rounded-full`.
*   **Toast Notification:** Slide in from top-center. `bg-slate-900 text-white rounded-full px-4 py-2 text-sm shadow-xl`. No borders.

---

## 5. Animations
*   **Page Entrance:** Everything fades in `opacity: 0 -> 1` and slides up `y: 10 -> 0`. Duration: `0.4s`, easing: `easeOut`. Stagger children by `0.1s`.
*   **Button Hover:** Scale to `1.02`. Transition: `duration 0.2s, ease-out`.
*   **Theme Toggle:** Rotation `180deg` on swap, fade in icon.
*   **Toast:** Slide down from `-20px` to `16px`. Auto-dismiss `2.5s`.

---

## 6. Dark Mode Spec
*   **The Switch:** Toggling dark mode instantly swaps variables without layout jumps.
*   **Component Shifts:**
    *   White cards (`#FFFFFF`) become Slate-900 (`#0F172A`).
    *   Slate-200 borders become Slate-800 (`#1E293B`).
    *   Primary buttons invert: White background, Slate-950 text.
    *   Empty state video backgrounds shift from `slate-100` to `slate-900`.
*   **Philosophy:** Ensure contrast remains high. Dark mode should feel like a dimly lit theater—distraction-free, focusing all attention on the video player.
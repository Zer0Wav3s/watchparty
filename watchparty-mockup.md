# WatchParty — Visual Mockup

This is a text-based representation of the UI redesign for Codex to implement.

---

## 🖥 1. Landing Page (Desktop View, Light Mode)

```
                            [    ] Theme Toggle  
                            [ 🌙 ] (top-right, 40px)
                                   
                                   
             [ W P ] (64px Logo, play button embedded, Purple)

             Watch Together, From Anywhere (4xl, 800)
    Create a room, share the link, press play. Everyone stays in sync. (lg, color: #6B7280)

               ┌─────────────────────────────────────┐
               │ 🔒 Room PIN (optional)              │ (48px height, 12px radius)
               └─────────────────────────────────────┘
               ┌─────────────────────────────────────┐
               │ ▶  Create Room                      │ (48px height, solid #8B5CF6)
               └─────────────────────────────────────┘

                                 ... 64px gap ...

    ┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐
    │  [⚡]                 │  │  [🛡]                 │  │  [📺]                 │
    │                       │  │                       │  │                       │
    │  Instant sync         │  │  PIN protection       │  │  YouTube & HLS        │
    │  Stay perfectly in    │  │  Optional security    │  │  Paste any valid      │
    │  sync with everyone   │  │  for private viewing  │  │  video link and       │
    │  in the room.         │  │  parties.             │  │  start watching.      │
    └───────────────────────┘  └───────────────────────┘  └───────────────────────┘
     (Hover: subtle shadow lift, -translate-y-1, 300ms ease-out)

```

---

## 📱 1B. Landing Page (Mobile View)

```
[ 🌙 ] (top-right)

       [ W P ]
 Watch Together, 
 From Anywhere
Create a room, share the 
link, press play.

┌──────────────────────┐
│ 🔒 Room PIN (opt)    │
└──────────────────────┘
┌──────────────────────┐
│ ▶ Create Room        │ (Solid Purple)
└──────────────────────┘

┌──────────────────────┐
│ [⚡]                 │
│ Instant sync         │
│ Stay perfectly in... │
└──────────────────────┘

┌──────────────────────┐
│ [🛡]                  │
│ PIN protection       │
│ Optional security... │
└──────────────────────┘

┌──────────────────────┐
│ [📺]                 │
│ YouTube & HLS        │
│ Paste any valid...   │
└──────────────────────┘
(Cards stack vertically, 24px gap)
```

---

## 🖥 2. Room Page Nav & Share Link (Header section)

```
┌─────────────────────────────────────────────────────────────┐
│ [ WP ]   [ Room: XYZ123 ] [ 👥 4 ]            [👑 Host] [🌙] │ <-- Header (56px)
└─────────────────────────────────────────────────────────────┘
   ↑          ↑                ↑                                
 (32px)     (ID Badge)       (Viewer Count)
 (Clickable)

         Share Room:  ┌─────────────────────────────┐ 
                      │ watchparty...app/room/X... 📋│  <-- Shareable Link
                      └─────────────────────────────┘     (Hover: Border goes purple)
                                                         (Click -> Toast "Copied!")

   ... Video Container below ...

```

**Toast Notification Component:**
```
               ┌───────────────────────────────┐
               │ ✅ Copied to clipboard!       │ <-- Slide up from bottom or drop from top
               └───────────────────────────────┘     (Dismisses after 3 seconds)
```

---

## Component Breakdown for Codex:

### 1. Logo Component (New)
* Needs a generic 64px version for the landing page hero and a 32px version for the room header.
* Can use Lucide `Clapperboard` or `Play` mixed with a circular backdrop if custom SVG is unfeasible, but ideally a rounded brand shape. `text-purple-500` icon. Wrap in `<Link href="/">`.

### 2. Feature Cards
* Three distinct descriptive blocks previously missing box constraints are now proper cards with `bg-white`, `border-gray-200`, `rounded-2xl`, `p-8`.

### 3. ShareLink Bar (New)
* Positioned below the main room `Header` but above the `VideoPlayer`.
* `<label>` element paired with a click-to-copy pill button containing the full `window.location.href`.
* Needs React state or `navigator.clipboard.writeText` alongside a global or local Toast mechanism.

### 4. Create Room Button (Updated)
* Removed the heavy gradient (`bg-gradient-to-br`) in favor of solid branding: `bg-purple-500 hover:bg-purple-600` (`var(--accent-primary)`).

### 5. Layout Containers
* Landing page converted from a tight center block to a spacious vertical flow: Hero -> Input -> Feature Grid. `max-w-5xl` for the grid.


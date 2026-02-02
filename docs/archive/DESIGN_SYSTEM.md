# OMies Design System (v2)

**Project Family:** OMies / Mantra Chain dApps & Website
**Version:** 2.0 (Tailwind v4 + Outfit)
**Last Updated:** January 2026

This document provides comprehensive guidelines for maintaining visual consistency across the OMies family (SPA, SSR, and Public Website).

> **Quick Reference:** See `DESIGN_SYSTEM_QUICK_REF.md` for a compact LLM-friendly version.
> **Design Tokens:** See `design-tokens.json` for the canonical token values.

## 1. Design Philosophy

* **Playful & Approachable:** Cartoon-inspired aesthetics with bold colors and friendly shapes.
* **Clean & Readable:** White cards on vibrant backgrounds for clarity.
* **Web3 Native:** Wallet-first interactions with clear status feedback.

## 2. Color System

### Core Palette (CSS Variables)

The following variables must be defined in ```src/styles/globals.css```:

| Name                | Hex       | Usage                         |
| ------------------- | --------- | ----------------------------- |
| `--background`      | `#7CAEBC` | Primary background (Teal)     |
| `--foreground`      | `#FFFFFF` | Default text on teal          |
| `--card`            | `#FFFFFF` | Card surfaces                 |
| `--card-foreground` | `#3B506C` | Text on cards (Dark Blue)     |
| `--primary`         | `#3B506C` | Buttons, Headings (Dark Blue) |
| `--secondary`       | `#F5B842` | Accents, Highlights (Gold)    |
| `--destructive`     | `#EF4444` | Errors (Red)                  |

### Cartoon Palette (Tailwind Config)

Use these specific utility classes for illustration elements:

* **Sky:** ```bg-brand-sky``` (`#4FA3DC`)
* **Hill (Back):** ```bg-brand-green-back``` (`#48BB78`)
* **Hill (Front):** ```bg-brand-green-front``` (`#68D391`)

## 3. Typography

**Font Family:** **Outfit** (Google Font)
* **Why:** Geometric, modern, and matches the "friendly professional" vibe.
* **Setup:** Import via Google Fonts in `MainLayout.astro` or CSS.

### Type Scale

| Element          | Class                      | Weight          | Style              |
| ---------------- | -------------------------- | --------------- | ------------------ |
| **Hero H1**      | ```text-5xl md:text-7xl``` | Black (900)     | Uppercase + Shadow |
| **Page H2**      | ```text-3xl md:text-4xl``` | Bold (700)      | Uppercase          |
| **Card Title**   | ```text-2xl```             | Semi-Bold (600) | Normal             |
| **Body**         | ```text-base```            | Regular (400)   | Normal             |
| **Code/Address** | ```font-mono text-xs```    | Regular (400)   | Normal             |

### The "Cartoon Shadow"

All Hero headings must use this text shadow to pop against the teal background:

```tsx
// Tailwind arbitrary value or custom utility
drop-shadow-[3px_3px_0_#000]
// OR inline style
style={{ textShadow: '3px 3px 0 #000' }}
```

## 4. Component Patterns

### Buttons
* **Shape:** Sharp corners ```rounded-[4px]``` (Do not use pill shapes by default).
* **Primary:** Dark Blue background (`#3B506C`), White text.
* **Secondary:** Gold background (`#F5B842`), Dark Blue text.
* **Outline:** White background, 2px black border, black text.
* **Sizes:** `h-10 px-4 py-2` (default), `h-9 px-3` (sm), `h-11 px-8` (lg).
* **Loading:** Include spinner with `loading={true}` prop.

### Cards
* **Shape:** Soft corners ```rounded-lg``` (1rem / 16px).
* **Style:** White background, `border-zinc-200`, `shadow-sm`.
* **Padding:** Standard is ```p-6``` with ```gap-6``` between sections.

### Cartoon Variant (for branded sections like "Join the Family")
* **Cards:** ```rounded-[2rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]```.
* **Buttons:** ```rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black```.
* **Text:** White ```text-white font-black```.

### Navbar (Glassmorphism)
* **Style:** ```bg-white/10 backdrop-blur-md border border-white/20```.
* **Shape:** ```rounded-2xl```.
* **Location:** Fixed at the top, floating above content.

## 5. Background & Layout

### The "Stage" Concept
Every page consists of two layers:

1.  **The Scene (z-index: -1):**
    The ```CartoonBackground``` component. It contains:
    * Teal base (`#7CAEBC`).
    * Cartoon sun with happy face (top-right).
    * Floating clouds with black outlines.
    * Green hills at the bottom (3 layers).

2.  **The Content (z-index: 10):**
    The actual page content (Navbar, Hero, Cards) sits relative on top of the scene.

## 6. Implementation Guide (Astro)

1.  **Tailwind v4 Setup:**
    Ensure ```src/styles/globals.css``` imports the OMies preset:
    ```css
    @import "tailwindcss";
    @plugin "tailwindcss-animate";
    @config "../../omies-preset.js";
    ```

2.  **Icons:**
    Use **Lucide React** for all UI icons.
    ```tsx
    import { Wallet, ArrowRight, Menu } from 'lucide-react';
    ```

3.  **Animations:**
    Use ```tailwindcss-animate``` for entry effects.
    * Page Load: ```animate-in fade-in zoom-in duration-700```.


# Design System Documentation

**Version:** 1.0  
**Project Family:** OMies / Mantra Chain dApps  
**Last Updated:** January 2026

This document provides comprehensive guidelines for maintaining visual consistency across all dApps in the OMies family. Use this as a reference when building new projects or providing context to LLM coding agents.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Components](#components)
6. [Backgrounds & Effects](#backgrounds--effects)
7. [Animation & Motion](#animation--motion)
8. [Icons & Assets](#icons--assets)
9. [Implementation Guide](#implementation-guide)
10. [File Structure](#file-structure)

---

## Design Philosophy

### Core Principles

1. **Playful & Approachable** - Cartoon-inspired aesthetics with bold colors and friendly shapes
2. **Clean & Readable** - White cards on vibrant backgrounds for clarity
3. **Consistent Hierarchy** - Clear visual weight from headers to body content
4. **Web3 Native** - Wallet-first interactions with clear status feedback
5. **Mobile-First** - Responsive design that works on all devices

### Visual Identity Keywords

- Cartoon / Illustrated
- Bold / Punchy
- Friendly / Approachable
- Clean / Modern
- Trustworthy / Professional

---

## Color System

### Brand Colors

| Name            | Hex       | HSL           | Usage                              |
| --------------- | --------- | ------------- | ---------------------------------- |
| **Teal**        | `#7CAEBC` | `193 30% 61%` | Primary background                 |
| **Sky Blue**    | `#4FA3DC` | `204 65% 59%` | Accent background, cartoon sky     |
| **Dark Blue**   | `#3B506C` | `216 30% 33%` | Primary text, buttons, headings    |
| **Gold/Yellow** | `#F5B842` | `42 87% 61%`  | Secondary accent, highlights, CTAs |
| **Pink**        | `#F23F98` | `331 87% 60%` | Accent, special highlights         |
| **Off-White**   | `#F8F9FA` | `210 17% 98%` | Card backgrounds                   |
| **White**       | `#FFFFFF` | `0 0% 100%`   | Cards, inputs, borders             |

### Semantic Colors

| Role                     | Light Mode           | Usage                              |
| ------------------------ | -------------------- | ---------------------------------- |
| `--background`           | `hsl(193 30% 61%)`   | Page background (teal)             |
| `--foreground`           | `hsl(0 0% 100%)`     | Default text on background (white) |
| `--card`                 | `hsl(0 0% 100%)`     | Card surfaces (white)              |
| `--card-foreground`      | `hsl(216 30% 33%)`   | Text on cards (dark blue)          |
| `--primary`              | `hsl(216 30% 33%)`   | Primary buttons (dark blue)        |
| `--primary-foreground`   | `hsl(0 0% 100%)`     | Text on primary (white)            |
| `--secondary`            | `hsl(42 87% 61%)`    | Secondary buttons (gold)           |
| `--secondary-foreground` | `hsl(216 30% 33%)`   | Text on secondary (dark blue)      |
| `--destructive`          | `hsl(0 84.2% 60.2%)` | Error states (red)                 |
| `--muted`                | `hsl(0 0% 100%)`     | Muted backgrounds                  |
| `--muted-foreground`     | `hsl(216 30% 33%)`   | Muted text                         |
| `--border`               | `hsl(0 0% 100%)`     | Border color (white)               |
| `--ring`                 | `hsl(216 30% 33%)`   | Focus rings (dark blue)            |

### CSS Variables (index.css)

```css
:root {
  --background: 193 30% 61%;      /* #7CAEBC Teal */
  --foreground: 0 0% 100%;        /* White */
  --card: 0 0% 100%;              /* White */
  --card-foreground: 216 30% 33%; /* #3B506C Dark Blue */
  --primary: 216 30% 33%;         /* #3B506C Dark Blue */
  --primary-foreground: 0 0% 100%;
  --secondary: 42 87% 61%;        /* #F5B842 Gold */
  --secondary-foreground: 216 30% 33%;
  --muted: 0 0% 100%;
  --muted-foreground: 216 30% 33%;
  --accent: 216 30% 33%;
  --accent-foreground: 0 0% 100%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 0 0% 100%;
  --input: 0 0% 100%;
  --ring: 216 30% 33%;
  --radius: 1rem;
}
```

### Green Accents (Cartoon Elements)

| Name                   | Hex       | Usage            |
| ---------------------- | --------- | ---------------- |
| **Green Hill (Back)**  | `#48BB78` | Background hills |
| **Green Hill (Front)** | `#68D391` | Foreground hills |

---

## Typography

### Font Family

**Primary Font:** FT Sterling Trial  
A clean, modern sans-serif with excellent readability.

**Weights Available:**
- Light (300)
- Book (350)
- Regular (400)
- Medium (500)
- Semi-Bold (600)
- Bold (700)

### Font Files Required

```
fonts/
├── FTSterlingTrial-Light.woff
├── FTSterlingTrial-LightItalic.woff
├── FTSterlingTrial-Book.woff
├── FTSterlingTrial-BookItalic.woff
├── FTSterlingTrial-Regular.woff
├── FTSterlingTrial-RegularItalic.woff
├── FTSterlingTrial-Medium.woff
├── FTSterlingTrial-MediumItalic.woff
├── FTSterlingTrial-Semi-Bold.woff
├── FTSterlingTrial-Semi-BoldItalic.woff
├── FTSterlingTrial-Bold.woff
└── FTSterlingTrial-BoldItalic.woff
```

### Type Scale

| Element          | Size                   | Weight          | Line Height     | Tracking         |
| ---------------- | ---------------------- | --------------- | --------------- | ---------------- |
| Hero Heading     | `text-5xl md:text-7xl` | `font-black`    | `leading-tight` | `tracking-tight` |
| Page Heading     | `text-3xl md:text-4xl` | `font-bold`     | `leading-tight` | `tracking-tight` |
| Card Title       | `text-2xl`             | `font-semibold` | `leading-none`  | Default          |
| Section Title    | `text-xl`              | `font-semibold` | Default         | Default          |
| Body             | `text-base`            | `font-normal`   | Default         | Default          |
| Small/Caption    | `text-sm`              | `font-medium`   | Default         | Default          |
| Mono (Addresses) | `text-xs font-mono`    | `font-normal`   | Default         | Default          |

### Hero Text Treatment

For main headlines, use the cartoon-style text shadow:

```tsx
<h1
  className="text-5xl md:text-7xl font-black tracking-tight text-white drop-shadow-[0_4px_0_#000] uppercase leading-tight"
  style={{ textShadow: '3px 3px 0 #000' }}
>
  Your Heading
</h1>
```

---

## Spacing & Layout

### Base Radius

```css
--radius: 1rem; /* 16px - rounded-lg */
```

### Border Radius Scale

| Class           | Value             | Usage            |
| --------------- | ----------------- | ---------------- |
| `rounded-lg`    | `1rem` (16px)     | Cards, dialogs   |
| `rounded-md`    | `0.875rem` (14px) | Medium elements  |
| `rounded-sm`    | `0.75rem` (12px)  | Small elements   |
| `rounded-[4px]` | `4px`             | Buttons          |
| `rounded-2xl`   | `1rem`            | Navbar container |

### Container

```js
container: {
  center: true,
  padding: "2rem",
  screens: {
    "2xl": "1400px",
  },
}
```

### Spacing Guidelines

| Context           | Recommendation     |
| ----------------- | ------------------ |
| Page padding      | `px-4`             |
| Card padding      | `px-6 py-6`        |
| Section spacing   | `space-y-8`        |
| Component gaps    | `gap-4` to `gap-6` |
| Max content width | `max-w-7xl`        |

---

## Components

### Button

**Variants:**
- `default` / `primary`: Dark blue background, white text
- `outline`: White background, black border (2px), black text
- `secondary`: Light gray background, black text
- `ghost`: Transparent, hover shows light gray
- `destructive`: Red background for dangerous actions
- `link`: Underlined text link

**Sizes:**
- `default`: `h-10 px-4 py-2`
- `sm`: `h-9 px-3`
- `lg`: `h-11 px-8`
- `icon`: `h-10 w-10`

**Key Styling:**
```tsx
// Sharp corners for buttons
rounded-[4px]

// Loading state with spinner
loading={true}
```

### Card

**Structure:**
```tsx
<Card>           {/* White bg, rounded-lg, shadow-sm */}
  <CardHeader>   {/* px-6, auto grid layout */}
    <CardTitle>
    <CardDescription>
  </CardHeader>
  <CardContent>  {/* px-6 */}
  <CardFooter>   {/* px-6, flex items-center */}
</Card>
```

**Default Styling:**
- Background: White (`bg-white`)
- Text: Dark Blue (`text-zinc-950` / `text-card-foreground`)
- Border: Light zinc (`border-zinc-200`)
- Shadow: Small (`shadow-sm`)
- Padding: `py-6` with `gap-6` between sections

### Dialog / Modal

**Overlay:** `bg-black/60 backdrop-blur-sm`

**Content:**
- Background: White
- Max width: `sm:max-w-lg`
- Border radius: `rounded-lg`
- Shadow: `shadow-lg`
- Padding: `p-6`
- Gap: `gap-4`

### Navbar

**Glass Effect:**
```tsx
<nav className="bg-white/10 border border-white/20 shadow-lg backdrop-blur-md rounded-2xl px-6">
```

- Semi-transparent white background
- Frosted glass blur
- Rounded corners
- Subtle border

### Toast Notifications

**Variants:**
- `default`: White background, dark text
- `destructive`: Red background (`bg-red-500`)
- `success`: Green background (`bg-green-500`)

### Form Inputs

- Background: White
- Border: Light (`border-zinc-200`)
- Focus ring: Dark blue (`ring-[var(--ring)]`)
- Border radius: Matches `--radius`

---

## Backgrounds & Effects

### Cartoon Background Component

The signature background features:
1. **Sky blue base** (`#4FA3DC`)
2. **Rotating sun rays** (white, 20% opacity, 60s rotation)
3. **Floating clouds** (white SVG with black stroke, pulse animation)
4. **Rolling green hills** (dual-layer for depth)

```tsx
<CartoonBackground />
// Usage: Place as first child of main container with z-[-1]
```

### Glass Effect (Navbar, Overlays)

```css
bg-white/10 backdrop-blur-md border border-white/20
```

### Card Shadows

- Standard: `shadow-sm`
- Elevated: `shadow-lg`
- Navbar: `shadow-lg` with backdrop blur

---

## Animation & Motion

### Built-in Keyframes

```js
keyframes: {
  "accordion-down": {
    from: { height: "0" },
    to: { height: "var(--radix-accordion-content-height)" },
  },
  "accordion-up": {
    from: { height: "var(--radix-accordion-content-height)" },
    to: { height: "0" },
  },
}
```

### Animation Classes

- `animate-accordion-down`: 0.2s ease-out
- `animate-accordion-up`: 0.2s ease-out
- `animate-in`: Tailwind CSS animate (entrance)
- `animate-out`: Tailwind CSS animate (exit)
- `animate-[spin_60s_linear_infinite]`: Sun rays rotation
- `animate-[pulse_8s_ease-in-out_infinite]`: Cloud pulse

### Page Transitions

```tsx
className="animate-in fade-in zoom-in duration-700"
```

### Dialog Animations

- Enter: `fade-in-0 zoom-in-95`
- Exit: `fade-out-0 zoom-out-95`

---

## Icons & Assets

### Icon Library

**Lucide React** - Consistent, clean line icons

Common icons used:
- `LogOut` - Disconnect/logout
- `Copy` - Copy to clipboard
- `X` / `XIcon` - Close dialogs
- `Loader2` - Loading spinner (with `animate-spin`)
- `Check` - Success states
- `AlertCircle` - Warnings/errors

### Brand Assets

```
assets/
├── cosmos-network.svg    # Cosmos logo
├── eth.svg              # Ethereum logo
├── om.svg               # OM token logo
├── network-mantra.svg   # Mantra network icon
├── copy.svg             # Custom copy icon
├── copy-hover.svg       # Copy hover state
├── address-link.svg     # External link icon
└── dapp-template.svg    # App logo
```

### Asset Guidelines

- Use SVG for all icons and logos
- Provide hover states for interactive icons
- Size icons consistently: `size-4` (16px), `size-5` (20px), `size-6` (24px)

---

## Implementation Guide

### Setting Up a New Project

1. **Install Dependencies**
   ```bash
   npm install tailwindcss-animate class-variance-authority clsx tailwind-merge
   npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-toast
   npm install lucide-react
   ```

2. **Copy Core Files**
   - `tailwind.config.js` (with brand colors)
   - `src/index.css` (CSS variables)
   - `src/assets/fonts/` (FT Sterling font files)
   - `src/shadcn/lib/utils.ts` (cn utility)

3. **Copy UI Components**
   - `src/shadcn/components/ui/` (Button, Card, Dialog, etc.)
   - `src/components/common/` (Custom components)
   - `src/components/scene/CartoonBackground.tsx`

4. **Configure ShadCN**
   ```json
   {
     "style": "default",
     "tsx": true,
     "tailwind": {
       "config": "",
       "css": "src/index.css",
       "baseColor": "zinc",
       "cssVariables": false
     },
     "aliases": {
       "components": "@/shadcn/components",
       "utils": "@/shadcn/lib/utils",
       "ui": "@/shadcn/components/ui"
     },
     "iconLibrary": "lucide"
   }
   ```

### Component Development Checklist

- [ ] Use CSS variables for colors (`hsl(var(--primary))`)
- [ ] Apply consistent border radius (`rounded-lg` for cards)
- [ ] Use Lucide icons consistently
- [ ] Add loading states to buttons
- [ ] Include proper focus states
- [ ] Test on mobile viewport
- [ ] Match existing spacing patterns

---

## File Structure

### Required Design System Files

```
your-project/
├── src/
│   ├── assets/
│   │   ├── fonts/           # FT Sterling font files (12 files)
│   │   └── *.svg            # Brand icons
│   ├── index.css            # CSS variables & base styles
│   ├── shadcn/
│   │   ├── components/
│   │   │   └── ui/          # ShadCN components (customized)
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       ├── dialog.tsx
│   │   │       ├── dropdown-menu.tsx
│   │   │       ├── input.tsx
│   │   │       ├── toast.tsx
│   │   │       └── ...
│   │   ├── hooks/
│   │   │   └── use-toast.ts
│   │   └── lib/
│   │       └── utils.ts      # cn() utility
│   └── components/
│       ├── common/           # Shared custom components
│       │   ├── Navbar.tsx
│       │   ├── ConnectWalletButton.tsx
│       │   ├── DialogIconHeader.tsx
│       │   └── ...
│       └── scene/
│           └── CartoonBackground.tsx
├── tailwind.config.js        # With brand colors
├── components.json           # ShadCN configuration
└── docs/
    └── DESIGN_SYSTEM.md      # This document
```

---

## Quick Reference for LLM Agents

When building new components or features for this design system, follow these rules:

### Colors
- Page background: Teal (`bg-[hsl(var(--background))]` or `#7CAEBC`)
- Cards: White with dark blue text
- Primary actions: Dark blue (`bg-primary`)
- Secondary/highlight: Gold (`bg-secondary` or `#F5B842`)
- Text on teal background: White

### Components
- Buttons: 4px border radius, dark blue primary
- Cards: White, 1rem radius, light shadow, `px-6 py-6`
- Dialogs: White, centered, blur overlay
- Navbar: Glass effect with `backdrop-blur-md`

### Typography
- Headlines: Heavy weight, uppercase, text shadow
- Body: Regular weight, dark blue on white surfaces
- Addresses/code: Monospace, small size

### Background
- Always include `<CartoonBackground />` for branded pages
- Hills and clouds create the signature look

### Animations
- Use `tailwindcss-animate` for enter/exit
- Subtle and fast (0.2s default)
- Loading states use `Loader2` icon with `animate-spin`

---

## Versioning

| Version | Date     | Changes                             |
| ------- | -------- | ----------------------------------- |
| 1.0     | Jan 2026 | Initial design system documentation |

---

**Note:** This design system is extracted from the OMies Come Home project. When creating new dApps, copy the core files and reference this document to maintain family consistency.

# OMies Public Site - Component Specs

> **Source of Truth:** `design-tokens.json` and `DESIGN_SYSTEM_QUICK_REF.md`

## 1. UI Components (React)

### Navbar
* Use `client:load` for immediate hydration.
* Glassmorphism style: `bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl`.
* "Launch App" button: Primary style, links to app.

### Hero Section
* H1: `text-5xl md:text-7xl font-black tracking-tight text-white uppercase` with `style={{ textShadow: '3px 3px 0 #000' }}`.
* CTA Buttons (standard):
    * Primary: `rounded-[4px] bg-[#3B506C] text-white h-10 px-4`.
    * Secondary: `rounded-[4px] bg-[#F5B842] text-[#3B506C] h-10 px-4`.

### Cards (standard)
* White background: `bg-white rounded-lg shadow-sm border-zinc-200`.
* Padding: `px-6 py-6` with `gap-6` between sections.
* Title: `text-2xl font-semibold text-[#3B506C]`.

### Button
* Shape: `rounded-[4px]` (sharp corners).
* Loading state: Include spinner via `loading={true}` prop.
* Variants: `default` (dark blue), `secondary` (gold), `outline`, `ghost`, `destructive`.

## 2. Cartoon Variant (branded sections)

For special sections like "Join the Family" or Migration App:
* **Cards:** `rounded-[2rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`.
* **Buttons:** `rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black`.
* **Dark section:** `bg-[#3B506C] text-white`.

## 3. Interactive Elements
* **CopyAddress:** Small utility to copy contract addresses (`font-mono text-xs`).
* **Marquee:** Scrolling banner of OMies faces (React + Framer Motion or pure CSS).

## 4. Background
* **CartoonBackground:**
    * Must be present on all pages at `z-[-1]`.
    * Teal background (`#7CAEBC`) or Sky Blue (`#4FA3DC`).
    * Optional: Cartoon sun with happy face, clouds with black outlines, 3-layer green hills.
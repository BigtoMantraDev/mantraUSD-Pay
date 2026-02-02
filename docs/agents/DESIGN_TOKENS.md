# OMies Design Tokens - Agent Reference

**Purpose:** This document contains the EXACT design tokens (colors, fonts, animations) that must be used in all OMies dApps. These values are extracted from `omies-preset.js` and `src/index.css`.

**Rule:** Never deviate from these hex codes, HSL values, or animation timings without explicit approval.

---

## 1. Color System

### CSS Variables (HSL Format)

These variables are defined in `src/index.css` and MUST be used via Tailwind utility classes.

| Variable Name              | HSL Value           | Hex Equivalent | Usage                               |
| -------------------------- | ------------------- | -------------- | ----------------------------------- |
| `--background`             | `193 30% 61%`       | `#7CAEBC`      | Primary page background (Teal)      |
| `--foreground`             | `0 0% 100%`         | `#FFFFFF`      | Default text on teal (White)        |
| `--card`                   | `0 0% 100%`         | `#FFFFFF`      | Card surfaces (White)               |
| `--card-foreground`        | `216 30% 33%`       | `#3B506C`      | Text on cards (Dark Blue)           |
| `--primary`                | `216 30% 33%`       | `#3B506C`      | Primary buttons, headings (Dark Blue)|
| `--primary-foreground`     | `0 0% 100%`         | `#FFFFFF`      | Text on primary (White)             |
| `--secondary`              | `42 87% 61%`        | `#F5B842`      | Secondary buttons, accents (Gold)   |
| `--secondary-foreground`   | `216 30% 33%`       | `#3B506C`      | Text on secondary (Dark Blue)       |
| `--muted`                  | `210 40% 96.1%`     | `#F4F6F8`      | Muted backgrounds                   |
| `--muted-foreground`       | `216 30% 33%`       | `#3B506C`      | Muted text (Dark Blue)              |
| `--destructive`            | `0 84.2% 60.2%`     | `#EF4444`      | Error states (Red)                  |
| `--destructive-foreground` | `210 40% 98%`       | `#FCFDFE`      | Text on destructive (Off-white)     |
| `--border`                 | `0 0% 100%`         | `#FFFFFF`      | Border color (White)                |
| `--input`                  | `0 0% 100%`         | `#FFFFFF`      | Input backgrounds (White)           |
| `--ring`                   | `216 30% 33%`       | `#3B506C`      | Focus rings (Dark Blue)             |

### Tailwind Usage

```tsx
// ✅ Correct - Using CSS variables via Tailwind
<div className="bg-background text-foreground">
<Card className="bg-card text-card-foreground">
<Button className="bg-primary text-primary-foreground">

// ❌ Wrong - Hardcoding colors
<div style={{ backgroundColor: '#7CAEBC' }}>
```

---

## 2. Brand Colors (Direct Hex Values)

These are defined in `omies-preset.js` under `theme.extend.colors.brand` and used for specific visual elements like the CartoonBackground.

| Name                | Hex Code  | Tailwind Class       | Usage                                |
| ------------------- | --------- | -------------------- | ------------------------------------ |
| **Teal**            | `#7CAEBC` | `bg-brand-teal`      | Primary background color             |
| **Sky Blue**        | `#4FA3DC` | `bg-brand-sky`       | Cartoon sky in CartoonBackground     |
| **Dark Blue**       | `#3B506C` | `bg-brand-blue`      | Primary text, buttons, headings      |
| **Gold/Yellow**     | `#F5B842` | `bg-brand-yellow`    | Secondary accents, highlights, CTAs  |
| **Pink**            | `#F23F98` | `bg-brand-pink`      | Special highlights (rarely used)     |
| **Green (Back)**    | `#48BB78` | `bg-brand-green`     | Background hills in CartoonBackground|
| **Green (Front)**   | `#68D391` | `bg-brand-green-light`| Foreground hills in CartoonBackground|

### CartoonBackground Specific Colors

**CRITICAL:** The CartoonBackground component MUST use these exact hex codes:

```tsx
// Sky layer
<div className="bg-[#4FA3DC]" />  // Sky Blue

// Hills layers
<div className="bg-[#48BB78]" />  // Back hill
<div className="bg-[#68D391]" />  // Front hill
```

---

## 3. Typography

### Font Family

**Primary Font:** **Outfit** (Google Font)

**Setup:**
```css
/* In src/index.css */
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;900&display=swap');
```

**Tailwind Configuration:**
```js
// In omies-preset.js
fontFamily: {
  sans: ['Outfit', 'system-ui', 'sans-serif'],
}
```

### Font Weights Available

| Weight   | Value | Usage                          |
| -------- | ----- | ------------------------------ |
| Light    | 300   | Rarely used                    |
| Regular  | 400   | Body text, descriptions        |
| Medium   | 500   | Small headings, labels         |
| Semi-Bold| 600   | Card titles, section headings  |
| Bold     | 700   | Page headings (H2, H3)         |
| Black    | 900   | Hero headings (H1)             |

### Type Scale

| Element              | Tailwind Classes                                                      | Weight Class  | Additional Styles                          |
| -------------------- | --------------------------------------------------------------------- | ------------- | ------------------------------------------ |
| **Hero Heading (H1)**| `text-5xl md:text-7xl`                                                | `font-black`  | `tracking-tight uppercase` + text shadow   |
| **Page Heading (H2)**| `text-3xl md:text-4xl`                                                | `font-bold`   | `tracking-tight uppercase`                 |
| **Card Title**       | `text-2xl`                                                            | `font-semibold`| `leading-none`                            |
| **Section Title**    | `text-xl`                                                             | `font-semibold`| Default line height                       |
| **Body Text**        | `text-base`                                                           | `font-normal` | Default line height                        |
| **Small/Caption**    | `text-sm`                                                             | `font-medium` | Default line height                        |
| **Mono/Address**     | `text-xs font-mono`                                                   | `font-normal` | Used for addresses and code                |

### The "Cartoon Shadow" (Critical for Hero Headings)

All Hero H1 headings MUST include this exact text shadow:

```tsx
// Tailwind utility (preferred)
<h1 className="text-5xl md:text-7xl font-black tracking-tight text-white uppercase drop-shadow-[3px_3px_0_#000]">

// OR inline style
<h1 
  className="text-5xl md:text-7xl font-black tracking-tight text-white uppercase"
  style={{ textShadow: '3px 3px 0 #000' }}
>
  Your Heading
</h1>
```

**Rules:**
* **Offset:** 3px right, 3px down.
* **Color:** Pure black `#000`.
* **No blur:** Sharp shadow.
* **Always uppercase** for hero headings.

---

## 4. Border Radius

Defined in `omies-preset.js` and via CSS variable `--radius`.

| Class              | Value                      | Usage                          |
| ------------------ | -------------------------- | ------------------------------ |
| `--radius`         | `1rem` (16px)              | Base radius variable           |
| `rounded-lg`       | `var(--radius)` (16px)     | Cards, dialogs, main containers|
| `rounded-md`       | `calc(var(--radius) - 2px)`| Medium elements (14px)         |
| `rounded-sm`       | `calc(var(--radius) - 4px)`| Small elements (12px)          |
| `rounded-button`   | `4px`                      | Buttons (sharp corners)        |
| `rounded-[4px]`    | `4px`                      | Buttons (explicit sharp)       |
| `rounded-2xl`      | `1rem`                     | Navbar container (floating)    |
| `rounded-full`     | `9999px`                   | Pills, avatars, badges         |

**Button Rule:** ALL buttons use `rounded-[4px]` for sharp corners, NOT pill shapes (`rounded-full`).

**Exception:** The WalletConnectPill (connected state) uses `rounded-full` for the entire pill container.

---

## 5. Spacing & Layout

### Container Configuration

```js
// In omies-preset.js
container: {
  center: true,
  padding: '2rem',
  screens: {
    '2xl': '1400px',
  },
}
```

**Usage:**
```tsx
<div className="container mx-auto px-4 py-12">
  <div className="max-w-4xl mx-auto space-y-8">
    {/* Content */}
  </div>
</div>
```

### Spacing Guidelines

| Context              | Recommendation          |
| -------------------- | ----------------------- |
| Page padding         | `px-4`                  |
| Card padding         | `px-6 py-6` or `p-6`    |
| Section spacing      | `space-y-8`             |
| Component gaps       | `gap-4` to `gap-6`      |
| Max content width    | `max-w-4xl` or `max-w-7xl`|
| Hero section padding | `py-12` or `py-20`      |

---

## 6. Animations & Keyframes

Defined in `omies-preset.js` under `theme.extend.keyframes` and `theme.extend.animation`.

### Sun Spin Animation

**Purpose:** Rotating sunburst in CartoonBackground.

**Keyframes:**
```js
'sun-spin': {
  from: { transform: 'translate(-50%, -50%) rotate(0deg)' },
  to: { transform: 'translate(-50%, -50%) rotate(360deg)' },
}
```

**Animation:**
```js
'sun-spin': 'sun-spin 60s linear infinite'
```

**Usage:**
```tsx
<div className="animate-sun-spin">
  {/* Sun rays SVG or div */}
</div>
```

**Timing:** 60 seconds per full rotation (slow, subtle).

### Cloud Pulse Animation

**Purpose:** Gentle breathing effect for clouds in CartoonBackground.

**Keyframes:**
```js
'cloud-pulse': {
  '0%, 100%': { transform: 'scale(1)', opacity: '0.9' },
  '50%': { transform: 'scale(1.05)', opacity: '1' },
}
```

**Animation:**
```js
'cloud-pulse': 'cloud-pulse 8s ease-in-out infinite'
```

**Usage:**
```tsx
<div className="animate-cloud-pulse">
  {/* Cloud SVG */}
</div>
```

**Timing:** 8 seconds per cycle (slow, gentle).

### Tailwind Animate Plugin

We use `tailwindcss-animate` for additional animations:

* `animate-in` - Entrance animations
* `animate-out` - Exit animations
* `fade-in-0` - Fade in from 0% opacity
* `zoom-in-95` - Zoom in from 95% scale
* `fade-out-0` - Fade out to 0% opacity
* `zoom-out-95` - Zoom out to 95% scale

**Dialog Example:**
```tsx
// Enter animation
<DialogContent className="animate-in fade-in-0 zoom-in-95">

// Exit animation
<DialogContent className="animate-out fade-out-0 zoom-out-95">
```

---

## 7. Shadow & Blur Effects

### Card Shadows

| Class       | Usage                               |
| ----------- | ----------------------------------- |
| `shadow-sm` | Standard cards                      |
| `shadow-lg` | Elevated cards, navbar, dialogs     |

### Glassmorphism (Navbar & Pills)

**Standard Glass Effect:**
```tsx
className="bg-white/10 backdrop-blur-md border border-white/20"
```

**Component Breakdown:**
* `bg-white/10` - 10% white background
* `backdrop-blur-md` - Medium blur on background
* `border border-white/20` - 20% white border

**Navbar Specific:**
```tsx
<nav className="bg-white/10 border border-white/20 shadow-lg backdrop-blur-md rounded-2xl px-6">
```

**WalletConnectPill (Connected State):**
```tsx
<div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-full pl-2 pr-4 py-1.5">
```

---

## 8. Icon Sizes

Consistent sizing for icons using Lucide React:

| Size Class | Pixel Value | Usage                              |
| ---------- | ----------- | ---------------------------------- |
| `size-4`   | 16px        | Small inline icons                 |
| `size-5`   | 20px        | Default inline icons               |
| `size-6`   | 24px        | Larger buttons, navigation         |
| `size-8`   | 32px        | Feature highlights                 |
| `size-12`  | 48px        | Large state indicators (loading)   |

**Example:**
```tsx
import { Loader2, Check, AlertCircle } from 'lucide-react';

<Loader2 className="size-12 animate-spin text-primary" />
<Check className="size-6 text-green-500" />
<AlertCircle className="size-5 text-destructive" />
```

---

## 9. Z-Index Strategy

**Critical:** Maintain these z-index layers to prevent visual conflicts.

| Layer                 | Z-Index Value | Usage                                    |
| --------------------- | ------------- | ---------------------------------------- |
| CartoonBackground     | `z-[-1]`      | Fixed background layer                   |
| Page Content          | `z-10`        | Standard page elements                   |
| Navbar                | `z-50`        | Fixed navbar at top                      |
| Dropdown/Popover      | `z-50`        | Dropdown menus, popovers                 |
| Dialog Overlay        | `z-50`        | Modal backdrop                           |
| Dialog Content        | `z-50`        | Modal content (sits above overlay)       |
| Toast Notifications   | `z-[100]`     | Highest priority, always visible         |

**Rule:** Never use arbitrary z-index values. Use the predefined layers.

---

## 10. Button Variants (Detailed Specifications)

### Default (Primary)

```tsx
<Button variant="default">
  Primary Action
</Button>
```

**Styling:**
* Background: `bg-primary` (#3B506C Dark Blue)
* Text: `text-primary-foreground` (White)
* Border Radius: `rounded-[4px]`
* Height: `h-10`
* Padding: `px-4 py-2`
* Hover: Slightly darker blue
* Focus: Ring with `ring-ring`

### Secondary

```tsx
<Button variant="secondary">
  Secondary Action
</Button>
```

**Styling:**
* Background: `bg-secondary` (#F5B842 Gold)
* Text: `text-secondary-foreground` (#3B506C Dark Blue)
* Border Radius: `rounded-[4px]`
* Height: `h-10`
* Padding: `px-4 py-2`

### Outline

```tsx
<Button variant="outline">
  Outline Action
</Button>
```

**Styling:**
* Background: `bg-white`
* Text: `text-primary`
* Border: `border-2 border-black`
* Border Radius: `rounded-[4px]`
* Height: `h-10`
* Padding: `px-4 py-2`

### Ghost

```tsx
<Button variant="ghost">
  Ghost Action
</Button>
```

**Styling:**
* Background: Transparent
* Text: `text-primary`
* Hover: Light gray background
* Border Radius: `rounded-[4px]`
* Height: `h-10`
* Padding: `px-4 py-2`

### Destructive

```tsx
<Button variant="destructive">
  Delete
</Button>
```

**Styling:**
* Background: `bg-destructive` (#EF4444 Red)
* Text: `text-destructive-foreground` (White)
* Border Radius: `rounded-[4px]`
* Height: `h-10`
* Padding: `px-4 py-2`

### Size Variants

```tsx
// Small
<Button size="sm">Small</Button>
// h-9 px-3

// Default
<Button>Default</Button>
// h-10 px-4 py-2

// Large
<Button size="lg">Large</Button>
// h-11 px-8

// Icon (square)
<Button size="icon">
  <Icon />
</Button>
// h-10 w-10
```

---

## 11. Dialog/Modal Specifications

### Overlay

```tsx
className="bg-black/60 backdrop-blur-sm"
```

* **Background:** 60% black
* **Blur:** Small blur effect

### Content Container

```tsx
className="bg-white rounded-lg shadow-lg max-w-lg p-6 gap-4"
```

* **Background:** White
* **Border Radius:** `rounded-lg` (16px)
* **Shadow:** Large shadow
* **Max Width:** `sm:max-w-lg` (32rem / 512px)
* **Padding:** `p-6` (24px)
* **Gap:** `gap-4` (16px between children)

### Animation

```tsx
// Enter
className="animate-in fade-in-0 zoom-in-95 duration-200"

// Exit
className="animate-out fade-out-0 zoom-out-95 duration-200"
```

**Timing:** 200ms (fast, responsive).

---

## 12. Form Input Specifications

### Standard Input

```tsx
<Input className="bg-white border-zinc-200 focus:ring-ring" />
```

* **Background:** White
* **Border:** Light zinc (`border-zinc-200`)
* **Focus Ring:** Dark blue (`ring-ring`)
* **Border Radius:** `rounded-md`
* **Height:** `h-10`
* **Padding:** `px-3 py-2`

### Label

```tsx
<Label className="text-sm font-medium text-card-foreground">
```

* **Size:** `text-sm`
* **Weight:** `font-medium`
* **Color:** Dark blue (`text-card-foreground`)

---

## 13. Loading States

### Spinner (Primary)

```tsx
import { Loader2 } from 'lucide-react';

<Loader2 className="animate-spin size-12 text-primary" />
```

**Usage:** Transaction processing, page loading.

### Skeleton

```tsx
<div className="animate-pulse bg-zinc-200 rounded h-4 w-32" />
```

**Usage:** Loading placeholders for content.

---

## 14. Success/Error State Colors

| State     | Color              | Hex Code  | Usage                          |
| --------- | ------------------ | --------- | ------------------------------ |
| Success   | Green              | `#22C55E` | Checkmarks, success messages   |
| Error     | Red (Destructive)  | `#EF4444` | Error icons, error messages    |
| Warning   | Yellow (Secondary) | `#F5B842` | Warning banners, caution icons |
| Info      | Blue (Primary)     | `#3B506C` | Info messages, neutral states  |

---

## 15. Quick Reference Table

| Token Category    | Key Value                                | Tailwind Class / Usage              |
| ----------------- | ---------------------------------------- | ----------------------------------- |
| **Background**    | Teal #7CAEBC                             | `bg-background`                     |
| **Card**          | White #FFFFFF                            | `bg-card`                           |
| **Text Primary**  | Dark Blue #3B506C                        | `text-primary`                      |
| **Text on Teal**  | White #FFFFFF                            | `text-foreground`                   |
| **Accent**        | Gold #F5B842                             | `bg-secondary`                      |
| **Font**          | Outfit (Google Font)                     | `font-sans`                         |
| **Hero Shadow**   | `3px 3px 0 #000`                         | `drop-shadow-[3px_3px_0_#000]`     |
| **Button Radius** | 4px                                      | `rounded-[4px]`                     |
| **Card Radius**   | 16px                                     | `rounded-lg`                        |
| **Sun Animation** | 60s rotation                             | `animate-sun-spin`                  |
| **Cloud Animation** | 8s pulse                               | `animate-cloud-pulse`               |
| **Sky Color**     | #4FA3DC                                  | `bg-[#4FA3DC]`                      |
| **Hills Colors**  | #48BB78 (back), #68D391 (front)          | `bg-[#48BB78]`, `bg-[#68D391]`     |

---

## 16. Code Samples

### Complete CartoonBackground Color Usage

```tsx
export function CartoonBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden">
      {/* Sky Layer */}
      <div className="absolute inset-0 bg-[#4FA3DC]" />
      
      {/* Sun Rays (rotating) */}
      <div className="absolute top-[20%] right-[15%] w-40 h-40 animate-sun-spin">
        {/* Rays implementation */}
      </div>
      
      {/* Hills */}
      <div className="absolute bottom-0 left-0 right-0">
        {/* Back hill */}
        <div className="absolute bottom-0 w-full h-[200px] bg-[#48BB78] rounded-t-[100%]" />
        
        {/* Front hill */}
        <div className="absolute bottom-0 w-full h-[150px] bg-[#68D391] rounded-t-[100%]" />
      </div>
    </div>
  );
}
```

### Complete Button with Loading State

```tsx
import { Loader2 } from 'lucide-react';

<Button 
  variant="default" 
  className="rounded-[4px]"
  disabled={isLoading}
>
  {isLoading ? (
    <>
      <Loader2 className="mr-2 size-4 animate-spin" />
      Processing...
    </>
  ) : (
    'Confirm'
  )}
</Button>
```

### Complete Hero Heading

```tsx
<h1 
  className="text-5xl md:text-7xl font-black tracking-tight text-white uppercase drop-shadow-[3px_3px_0_#000]"
  style={{ textShadow: '3px 3px 0 #000' }}
>
  Welcome to OMies
</h1>
```

---

**End of Design Tokens Reference**

**Remember:** These values are the source of truth. Never use arbitrary colors, fonts, or animations without referring to this document first.

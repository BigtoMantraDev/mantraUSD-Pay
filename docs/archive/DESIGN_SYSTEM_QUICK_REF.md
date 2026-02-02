# Design System Quick Reference

> **Compact reference for LLM coding agents** - Use this when generating code for OMies family dApps.

## Color Tokens

```css
/* Core Palette */
--background: 193 30% 61%;       /* #7CAEBC Teal - page bg */
--foreground: 0 0% 100%;         /* White - text on teal */
--card: 0 0% 100%;               /* White - card surfaces */
--card-foreground: 216 30% 33%;  /* #3B506C Dark Blue - card text */
--primary: 216 30% 33%;          /* #3B506C Dark Blue - buttons */
--primary-foreground: 0 0% 100%; /* White */
--secondary: 42 87% 61%;         /* #F5B842 Gold - accents */
--secondary-foreground: 216 30% 33%;
--destructive: 0 84.2% 60.2%;    /* Red - errors */
--radius: 1rem;

/* Brand Colors (Tailwind) */
brand-teal: '#7CAEBC'
brand-blue: '#3B506C'
brand-yellow: '#F5B842'
brand-pink: '#F23F98'
sky-blue: '#4FA3DC'
```

## Typography

**Font:** FT Sterling Trial (woff files required)
- Headlines: `text-5xl md:text-7xl font-black tracking-tight uppercase`
- Hero shadow: `style={{ textShadow: '3px 3px 0 #000' }}`
- Card titles: `text-2xl font-semibold`
- Body: `text-base`
- Addresses: `text-xs font-mono`

## Component Patterns

### Button
```tsx
// Primary (dark blue)
<Button variant="default">Action</Button>

// Outline (white + black border)
<Button variant="outline">Secondary</Button>

// With loading
<Button loading={true}>Processing</Button>

// Styling: rounded-[4px], h-10 px-4
```

### Card
```tsx
<Card className="bg-white shadow-sm rounded-lg">
  <CardHeader className="px-6">
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent className="px-6">
    Content
  </CardContent>
</Card>
```

### Glass Navbar
```tsx
<nav className="bg-white/10 border border-white/20 backdrop-blur-md shadow-lg rounded-2xl px-6">
```

### Dialog Overlay
```tsx
className="bg-black/60 backdrop-blur-sm"
```

## Layout

- Max width: `max-w-7xl`
- Container: `container mx-auto px-4`
- Section spacing: `space-y-8`
- Card padding: `px-6 py-6`
- Border radius: `rounded-lg` (1rem)

## Background

Always include for branded pages:
```tsx
import { CartoonBackground } from '@/components/scene/CartoonBackground';
// Place at start of main container with z-[-1]
```

Features: Sky blue (`#4FA3DC`) + rotating sun rays + clouds + green hills

## Icons

Use **Lucide React**:
```tsx
import { LogOut, Copy, X, Loader2, Check, AlertCircle } from 'lucide-react';
// Loading: <Loader2 className="animate-spin" />
```

## Animations

```tsx
// Page entry
className="animate-in fade-in zoom-in duration-700"

// Accordion
animate-accordion-down: 0.2s ease-out

// Use tailwindcss-animate for enter/exit
```

## Required Dependencies

```json
{
  "tailwindcss-animate": "^1.x",
  "class-variance-authority": "^0.x", 
  "clsx": "^2.x",
  "tailwind-merge": "^2.x",
  "@radix-ui/react-dialog": "^1.x",
  "@radix-ui/react-dropdown-menu": "^2.x",
  "@radix-ui/react-toast": "^1.x",
  "lucide-react": "^0.x"
}
```

## Key Files to Copy

```
src/index.css              # CSS variables
src/assets/fonts/          # 12 FT Sterling woff files
src/shadcn/components/ui/  # Customized components
src/shadcn/lib/utils.ts    # cn() utility
src/components/scene/CartoonBackground.tsx
tailwind.config.js         # Brand colors
components.json            # ShadCN config
```

## Rules for New Components

1. Use `hsl(var(--token))` for semantic colors
2. Cards: white bg, dark blue text, rounded-lg
3. Buttons: rounded-[4px], not rounded-lg
4. Include loading states with Loader2 spinner
5. Focus rings use dark blue (`ring-[var(--ring)]`)
6. Mobile-first responsive design
7. Match existing spacing (gap-4, px-6, etc.)

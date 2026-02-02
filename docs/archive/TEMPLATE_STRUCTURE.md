# OMies Public Website (Astro) - Template Structure

This document outlines the required file organization for the OMies public-facing website. All LLM Agents must adhere to this structure to ensure the "Family" design system is applied correctly.

## 1. Core Directories

```text
/src
  ├── /assets
  │   ├── /fonts             # Local font files (Outfit)
  │   └── /images            # SVG Icons (OM logo, Network icons, etc.)
  │
  ├── /components
  │   ├── /ui                # ShadCN React Primitives (Button, Card, etc.)
  │   │                      # *Must use React versions, not Astro components*
  │   ├── /common            # Shared Components (Navbar, Footer, WalletPill)
  │   ├── /scene             # CartoonBackground.tsx (The visual anchor)
  │   └── /landing           # Landing page specific sections (Hero, Features, etc.)
  │
  ├── /layouts
  │   └── MainLayout.astro   # The "Shell" component.
  │                          # Includes <head>, global CSS, and <CartoonBackground />
  │
  ├── /pages
  │   ├── index.astro        # Homepage
  │   └── /blog              # Blog routes (e.g., [slug].astro)
  │
  ├── /content               # Astro Content Collections
  │   ├── /docs              # Documentation files (MDX)
  │   └── /blog              # Blog posts (MDX)
  │
  └── /styles
      └── globals.css        # Tailwind directives & CSS variables
```

## 2. Configuration Files

These files are critical for the build process and style consistency.

* **`astro.config.mjs`**: The Astro configuration.
    * **Rule:** Must include `react()` and `tailwind()` (via `@tailwindcss/vite`) in the plugins/integrations.

* **`omies-preset.js`**: The shared design tokens file located in the project root.
    * **Rule:** Defines colors (`brand-teal`, `brand-blue`), fonts (`Outfit`), and animations (`sun-spin`).

* **`src/styles/globals.css`**: The global stylesheet.
    * **Rule:** Must import the preset logic. For Tailwind v4, use:
    ```css
    @import "tailwindcss";
    @plugin "tailwindcss-animate";
    @config "../../omies-preset.js";
    ```
    * **Rule:** Must define the CSS variables (`--background`, `--primary`, etc.) for the OMies Design System.

## 3. Key Component Rules

* **`src/layouts/MainLayout.astro`**:
    * This is the entry point for styling.
    * It handles the generic metadata (SEO).
    * It **must** render `<CartoonBackground client:idle />` (or static) as the first child of `<body>` with `z-index: -1`.

* **`src/components/scene/CartoonBackground.tsx`**:
    * The React component responsible for the hills, clouds, and rotating sun rays.
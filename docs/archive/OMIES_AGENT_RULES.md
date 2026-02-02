# OMies Public Website (Astro) - Agent Instructions

**Role:** You are an expert Astro & React Engineer building the public face of the OMies NFT family.
**Goal:** Build a high-performance, SEO-friendly site that matches the "OMies" brand identity perfectly.

> **Source of Truth:** `design-tokens.json` and `DESIGN_SYSTEM_QUICK_REF.md` in the `/docs` folder.

## 1. Tech Stack Constraints
* **Framework:** Astro (Latest).
* **UI Library:** React (via `@astrojs/react`).
* **Styling:** Tailwind CSS v4 (via `@tailwindcss/vite`).
* **State/Interactivity:** Use Astro Islands (`client:load`, `client:visible`).
* **Icons:** Lucide React (Stroke width: 2px).
* **Content:** Astro Content Collections (`src/content/`).

## 2. Visual Identity & Design System
**Crucial:** Adhere to the OMies Design System.

### Color Palette (Tailwind)
* **Page Background:** Teal (`bg-[hsl(var(--background))]`).
* **Cards:** Pure White (`bg-white` or `bg-card`).
* **Text:** Dark Blue (`text-brand-blue` or `text-primary`).
* **Accents:** Gold/Yellow (`text-brand-yellow` or `bg-secondary`).

### Typography (Outfit)
* **Font:** Outfit (Google Font).
* **Headlines (H1/H2):**
    * `text-5xl md:text-7xl font-black tracking-tight uppercase`.
    * **MANDATORY SHADOW:** `style={{ textShadow: '3px 3px 0 #000' }}`.
* **Body:** Regular Weight (400), Dark Blue.

### Components
* **Buttons:** `rounded-[4px]` (sharp corners), NOT pill shapes.
* **Cards:** `rounded-lg shadow-sm` (standard), OR cartoon variant for branded sections.
* **Loading states:** Use Lucide `Loader2` with `animate-spin`.

### Layout & Background
* **The "Cartoon Stage":** All pages must use the `MainLayout.astro` which includes the fixed `<CartoonBackground />`.
* **Z-Index:** Background is `z-[-1]`, Content is `z-10`.

## 3. Astro Coding Patterns

### Hydration (Islands)
* **Static First:** Render as much as possible in `.astro` files.
* **Interactive Elements:**
    * `Navbar.tsx` -> Use `client:load` (Needs immediate hydration).
    * `CartoonBackground.tsx` -> Use `client:idle` or static if possible.

### Routing
* Use file-based routing in `src/pages/`.
* Use `getStaticPaths()` for dynamic routes if SSG.

## 4. "Golden Sample" Layout
Every page should look like this:

```astro
---
import MainLayout from '@/layouts/MainLayout.astro';
import { HeroSection } from '@/components/landing/HeroSection';
---

<MainLayout title="Home | OMies">
  <main class="container mx-auto px-4 py-12">
    {/* React Component Island */}
    <HeroSection client:load />
    
    {/* Static Astro Content */}
    <section class="mt-20 space-y-8">
      <h2 class="text-4xl font-black uppercase drop-shadow-[3px_3px_0_#000] text-white">
        Meet the Family
      </h2>
      <slot />
    </section>
  </main>
</MainLayout>
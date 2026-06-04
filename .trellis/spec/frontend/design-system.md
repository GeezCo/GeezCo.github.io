# Design System Implementation

## Overview

This document captures the design system implementation patterns and conventions for the GeezCo portal, based on the Stripe + Vercel design fusion.

---

## Design Decision: Stripe + Vercel Fusion

**Context**: The portal needed a professional, developer-focused visual identity that balances elegance with technical credibility.

**Options Considered**:
1. Pure Vercel style - Black/white minimalism with colorful gradients
2. Pure Linear style - Deep black luxury with single accent color
3. Pure Stripe style - Deep blue professional with electric indigo
4. **Stripe + Vercel fusion** - Stripe's professional foundation with Vercel's gradient decoration

**Decision**: We chose Stripe + Vercel fusion because:
- Stripe's thin typography (300 weight) provides elegance and professionalism
- Stripe's deep blue ink (#0d253d) is more approachable than pure black
- Vercel's multi-color gradient adds visual interest without overwhelming
- The combination works well for both technical content and marketing

**Implementation**:

```css
/* CSS Variables in global.css */
:root {
  /* Stripe Colors */
  --color-primary: #533afd;           /* Electric indigo */
  --color-ink: #0d253d;               /* Deep blue ink */
  --color-canvas: #ffffff;
  --color-canvas-soft: #f6f9fc;       /* Near-white */
  
  /* Vercel Gradients */
  --color-gradient-cyan: #50e3c2;
  --color-gradient-blue: #007cf0;
  --color-gradient-magenta: #ff0080;
  --color-gradient-amber: #f9cb28;
  
  /* Typography (Stripe style) */
  --font-sans: 'SF Pro Display', system-ui, -apple-system, sans-serif;
}
```

**Extensibility**: 
- Add new gradient combinations in `--color-gradient-*` variables
- Extend color palette while maintaining Stripe's professional tone
- Keep typography weights light (300-400) for consistency

---

## Convention: CSS Variables for Design Tokens

**What**: All design tokens (colors, spacing, typography) are defined as CSS variables in `src/styles/global.css`.

**Why**: 
- Centralized design system management
- Easy theme switching (light/dark mode)
- Consistent values across all components
- AI agents can reference variables instead of hardcoding values

**Example**:

```css
/* Good - Using design tokens */
.hero {
  background: var(--color-canvas-soft);
  color: var(--color-ink);
  padding: var(--spacing-xl);
  border-radius: var(--rounded-lg);
}

/* Bad - Hardcoded values */
.hero {
  background: #f6f9fc;
  color: #0d253d;
  padding: 24px;
  border-radius: 12px;
}
```

**Related**: See `DESIGN.md` for complete token reference.

---

## Pattern: Vercel Gradient Mesh Background

**Problem**: How to add visual interest to hero sections without overwhelming content.

**Solution**: Use a multi-color gradient mesh as a background layer with blur and low opacity.

**Example**:

```css
/* Hero gradient implementation */
.hero {
  position: relative;
  background: var(--color-canvas);
}

.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    var(--color-gradient-cyan) 0%,
    var(--color-gradient-blue) 33%,
    var(--color-gradient-magenta) 66%,
    var(--color-gradient-amber) 100%
  );
  opacity: 0.12;  /* Light mode */
  filter: blur(80px);
  z-index: 0;
}

html.dark .hero::before {
  opacity: 0.08;  /* Darker in dark mode */
}
```

**Why**: 
- Gradient is decorative, not structural
- Low opacity prevents distraction
- Blur creates atmospheric effect
- `::before` keeps gradient separate from content

---

## Pattern: Stripe Thin Typography

**Problem**: How to achieve elegant, professional typography without custom fonts.

**Solution**: Use system fonts with thin weights (300) and negative letter-spacing.

**Example**:

```css
/* Display typography (Stripe style) */
.display-xl {
  font-family: var(--font-sans);
  font-size: 3rem;        /* 48px */
  font-weight: 300;       /* Thin */
  line-height: 1.15;
  letter-spacing: -0.06em; /* Negative tracking */
}

.body-md {
  font-family: var(--font-sans);
  font-size: 0.9375rem;   /* 15px */
  font-weight: 300;
  line-height: 1.4;
  letter-spacing: 0;
}
```

**Why**:
- Thin weights (300) create elegance without custom fonts
- Negative letter-spacing on large text improves readability
- System fonts ensure fast loading
- Consistent with Stripe's editorial style

---

## Pattern: Flat Documentation Navigation

**Problem**: Multi-level nested card navigation creates friction (click → list → click → list → content).

**Solution**: Single-page documentation interface with sidebar tree navigation.

**Structure**:

```
/doc → Unified documentation interface
  ├── Left sidebar (280px fixed)
  │   ├── System A (collapsible)
  │   │   ├── Doc 1
  │   │   └── Doc 2
  │   └── System B (collapsible)
  │       ├── Doc 1
  │       └── Doc 2
  └── Right content area (max-width 56rem)
      └── Current document content
```

**Implementation**:

```astro
<!-- DocLayout.astro -->
<div class="doc-container">
  <aside class="doc-sidebar">
    <DocSidebar systems={allSystems} currentPath={currentPath} />
  </aside>
  <main class="doc-content">
    <slot />
  </main>
</div>

<style>
  .doc-container {
    display: flex;
    max-width: 90rem;
    margin: 0 auto;
  }
  
  .doc-sidebar {
    width: 280px;
    position: sticky;
    top: 4rem;
    height: calc(100vh - 4rem);
    overflow-y: auto;
    background: var(--color-canvas-soft);
    border-right: 1px solid var(--color-hairline);
  }
  
  .doc-content {
    flex: 1;
    max-width: 56rem;
    padding: var(--spacing-xl);
  }
</style>
```

**Why**:
- Reduces clicks: direct navigation to any document
- Better overview: see all systems and docs at once
- Scalable: supports multiple systems without nested pages
- Standard pattern: matches Stripe, Vercel, Linear docs

**Extensibility**:
- Add new systems by adding folders in `src/content/docs/`
- Support multi-level nesting in sidebar tree
- Add search within sidebar for large doc sets

---

## Convention: Dark Mode Color Mapping

**What**: Dark mode uses a deep blue-black theme, not pure black.

**Why**: 
- Softer on eyes than pure black
- Maintains Stripe's professional blue tone
- Better contrast for colored elements

**Example**:

```css
/* Light mode */
:root {
  --color-canvas: #ffffff;
  --color-ink: #0d253d;
  --color-hairline: #e3e8ee;
}

/* Dark mode */
html.dark {
  --color-canvas: #0a1628;      /* Deep blue-black */
  --color-ink: #e2e8f0;         /* Light gray */
  --color-hairline: #2d3f5f;    /* Blue-gray */
  --color-dark-bg: #0a1628;
  --color-dark-surface: #1a2942;
  --color-dark-text: #e2e8f0;
  --color-dark-border: #2d3f5f;
}
```

**Related**: All components must use CSS variables, never hardcoded colors.

---

## Don't: Hardcode Design Values

**Problem**:
```astro
<!-- Bad - Hardcoded values -->
<div style="background: #f6f9fc; padding: 24px; border-radius: 12px;">
  <h1 style="font-size: 48px; font-weight: 300; color: #0d253d;">
    Title
  </h1>
</div>
```

**Why it's bad**: 
- Breaks design system consistency
- Can't switch themes
- Hard to maintain
- AI agents may not know the correct values

**Instead**:
```astro
<!-- Good - Using design tokens -->
<div class="card">
  <h1 class="display-xl">Title</h1>
</div>

<style>
  .card {
    background: var(--color-canvas-soft);
    padding: var(--spacing-xl);
    border-radius: var(--rounded-lg);
  }
  
  .display-xl {
    font-size: 3rem;
    font-weight: 300;
    color: var(--color-ink);
  }
</style>
```

---

## Common Mistake: Forgetting Dark Mode

**Symptom**: Component looks great in light mode but broken in dark mode.

**Cause**: Using light-mode-only color variables or hardcoded colors.

**Fix**: Always use semantic color variables that adapt to theme.

**Prevention**:
1. Use `var(--color-canvas)` not `#ffffff`
2. Use `var(--color-ink)` not `#0d253d`
3. Test both light and dark modes
4. Check `html.dark` styles for all components

**Example**:
```css
/* Good - Theme-aware */
.component {
  background: var(--color-canvas);
  color: var(--color-ink);
  border: 1px solid var(--color-hairline);
}

/* Bad - Light mode only */
.component {
  background: #ffffff;
  color: #0d253d;
  border: 1px solid #e3e8ee;
}
```

---

## Gotcha: Gradient Opacity in Dark Mode

> **Warning**: Vercel gradient backgrounds need lower opacity in dark mode to avoid overwhelming the content.
>
> Light mode: `opacity: 0.12`  
> Dark mode: `opacity: 0.08`
>
> This maintains visual interest without reducing readability on dark backgrounds.

---

## Reference: Design System Files

| File | Purpose |
|------|---------|
| `DESIGN.md` | Complete design system documentation (colors, typography, spacing, components) |
| `src/styles/global.css` | CSS variables implementation |
| `src/pages/index.astro` | Hero gradient example |
| `src/components/Header.astro` | Navigation styling example |
| `src/layouts/DocLayout.astro` | Documentation layout example |

---

## Quality Checklist for New Components

When creating new components, ensure:

- [ ] Uses CSS variables for all colors
- [ ] Uses CSS variables for spacing and border-radius
- [ ] Typography follows Stripe style (300-400 weights)
- [ ] Includes dark mode styles (`html.dark`)
- [ ] Responsive design (mobile < 768px, tablet 768-1023px, desktop ≥ 1024px)
- [ ] Follows design token naming from `DESIGN.md`
- [ ] No hardcoded hex colors
- [ ] No hardcoded pixel values for spacing

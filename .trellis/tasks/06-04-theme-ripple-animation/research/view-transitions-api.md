# Research: View Transitions API for Circular Ripple Theme Switching

- **Query**: How to use View Transitions API for circular ripple theme transition from click position
- **Scope**: External documentation + best practices
- **Date**: 2026-06-04

## Executive Summary

View Transitions API provides a browser-native way to create smooth transitions between DOM states. For circular ripple theme switching, the key is:
1. **Disable the default crossfade animation** completely
2. **Apply clip-path animation to the new state** (not the old state)
3. **Keep both old and new states fully visible** (no opacity changes)
4. **Calculate circle radius to cover entire viewport** from click position

## Core Concept

The View Transitions API creates pseudo-elements during the transition:

```
::view-transition
└─ ::view-transition-group(root)
   └─ ::view-transition-image-pair(root)
      ├─ ::view-transition-old(root)  ← Old theme snapshot
      └─ ::view-transition-new(root)  ← New theme snapshot
```

By default, the API crossfades between old and new (opacity animation). **This default behavior must be completely disabled** for circular reveal to work correctly.

## Critical Implementation Pattern

### 1. Disable Default Crossfade Animation

The default View Transitions animation uses opacity changes, which causes:
- Flash/flicker during transition
- Double animation effect when combined with clip-path
- Content visibility issues

**Solution**: Set both old and new pseudo-elements to opacity 1 and disable their animations:

```css
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  opacity: 1;
}
```

### 2. Apply Clip-Path to New State Only

The circular reveal effect is achieved by animating a `clip-path` on `::view-transition-new(root)`:

```css
::view-transition-new(root) {
  animation: reveal-circular 600ms ease-in-out;
}

@keyframes reveal-circular {
  from {
    clip-path: circle(0% at var(--x) var(--y));
  }
  to {
    clip-path: circle(150% at var(--x) var(--y));
  }
}
```

**Why 150%?** To ensure the circle covers the entire viewport from any click position (diagonal distance from corner to opposite corner).

### 3. Set Click Position as CSS Custom Properties

Before starting the transition, inject the click coordinates:

```javascript
document.documentElement.style.setProperty('--x', `${e.clientX}px`);
document.documentElement.style.setProperty('--y', `${e.clientY}px`);
```

### 4. Execute Transition with startViewTransition

```javascript
if (!document.startViewTransition) {
  // Fallback for unsupported browsers
  document.documentElement.classList.toggle('dark');
  return;
}

const transition = document.startViewTransition(() => {
  document.documentElement.classList.toggle('dark');
});
```

## Complete Implementation Example

```typescript
// ThemeToggle.astro or similar
function toggleTheme(e: MouseEvent) {
  // 1. Set click position
  const x = e.clientX;
  const y = e.clientY;
  document.documentElement.style.setProperty('--x', `${x}px`);
  document.documentElement.style.setProperty('--y', `${y}px`);

  // 2. Check browser support
  if (!document.startViewTransition) {
    document.documentElement.classList.toggle('dark');
    return;
  }

  // 3. Start transition
  document.startViewTransition(() => {
    document.documentElement.classList.toggle('dark');
  });
}
```

```css
/* Disable default crossfade */
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  opacity: 1;
  mix-blend-mode: normal;
}

/* Apply circular reveal to new state */
::view-transition-new(root) {
  animation: reveal-circular 600ms ease-in-out;
}

@keyframes reveal-circular {
  from {
    clip-path: circle(0% at var(--x) var(--y));
  }
  to {
    clip-path: circle(150% at var(--x) var(--y));
  }
}
```

## Common Pitfalls and Solutions

### Pitfall 1: Content Disappears on Click

**Symptom**: The moment you click, entire screen goes black/white before animation starts.

**Root Cause**: Default opacity animation on `::view-transition-old(root)` fades out immediately.

**Solution**: Explicitly disable animations on both old and new pseudo-elements:

```css
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
}
```

### Pitfall 2: Double Animation Effect

**Symptom**: Content fades AND reveals circularly at the same time, looks janky.

**Root Cause**: Default crossfade animation runs alongside your custom clip-path animation.

**Solution**: Same as Pitfall 1 - disable default animations completely.

### Pitfall 3: Circle Doesn't Cover Entire Screen

**Symptom**: Circle stops before reaching screen edges, especially from corner clicks.

**Root Cause**: Using `100%` radius only covers distance from center, not diagonal.

**Solution**: Use `150%` or calculate exact radius:

```javascript
const maxRadius = Math.sqrt(
  Math.max(x, window.innerWidth - x) ** 2 +
  Math.max(y, window.innerHeight - y) ** 2
);
document.documentElement.style.setProperty('--radius', `${maxRadius}px`);
```

```css
@keyframes reveal-circular {
  to {
    clip-path: circle(var(--radius) at var(--x) var(--y));
  }
}
```

### Pitfall 4: Animation Stutters or Lags

**Root Cause**: Browser is re-rendering complex DOM during transition.

**Solution**: View Transitions API already optimizes by taking snapshots. Ensure:
- Avoid triggering layout changes during transition callback
- Keep transition callback synchronous and fast
- Only toggle classes, don't manipulate DOM structure

### Pitfall 5: Mix-Blend-Mode Interference

**Symptom**: Colors look wrong during transition.

**Root Cause**: Previous attempts using `mix-blend-mode` left CSS rules.

**Solution**: Explicitly reset blend mode:

```css
::view-transition-old(root),
::view-transition-new(root) {
  mix-blend-mode: normal;
}
```

## Browser Support and Fallback

### Support Status (2026)

- **Chrome/Edge**: 111+ (April 2023)
- **Safari**: Not yet supported
- **Firefox**: Behind flag, not production-ready

### Recommended Fallback Strategy

```javascript
function toggleTheme(e: MouseEvent) {
  if (!document.startViewTransition) {
    // Instant theme switch for unsupported browsers
    document.documentElement.classList.toggle('dark');
    return;
  }
  
  // ... View Transitions code
}
```

**Reasoning**: Graceful degradation. Users on unsupported browsers get instant theme change without animation, which is perfectly acceptable UX.

### Feature Detection

```javascript
if ('startViewTransition' in document) {
  // Use View Transitions API
} else {
  // Fallback
}
```

## Performance Considerations

### Memory Usage

- Browser takes two full-page snapshots (old and new states)
- Memory usage is proportional to viewport size, not DOM complexity
- Typically 2-10 MB depending on screen resolution
- Released immediately after transition completes

### Frame Rate

- Should maintain 60fps on modern devices
- Browser handles compositing on GPU layer
- No manual optimization needed for typical pages

### Best Practices

1. **Keep transition callback fast**: Only change classes/attributes, don't manipulate DOM structure
2. **Avoid nested transitions**: Wait for current transition to complete before starting another
3. **Use reasonable animation duration**: 300-800ms is ideal range (600ms recommended)
4. **Don't animate during scroll**: Can cause jank on mobile

## Advanced: Handling Transition Lifecycle

```javascript
const transition = document.startViewTransition(() => {
  document.documentElement.classList.toggle('dark');
});

// Wait for animation to finish
await transition.finished;

// Or handle errors
transition.finished.catch(err => {
  console.log('Transition interrupted', err);
});

// Skip transition programmatically
transition.skipTransition();
```

## Complete Working Code

### HTML/Astro Component

```astro
---
// ThemeToggle.astro
---

<button id="theme-toggle" type="button" aria-label="Toggle theme">
  <span class="icon-light">☀️</span>
  <span class="icon-dark">🌙</span>
</button>

<script>
  const button = document.getElementById('theme-toggle');
  
  button?.addEventListener('click', (e: MouseEvent) => {
    const x = e.clientX;
    const y = e.clientY;
    
    // Calculate exact radius to cover entire viewport
    const endRadius = Math.sqrt(
      Math.max(x, window.innerWidth - x) ** 2 +
      Math.max(y, window.innerHeight - y) ** 2
    );
    
    document.documentElement.style.setProperty('--x', `${x}px`);
    document.documentElement.style.setProperty('--y', `${y}px`);
    document.documentElement.style.setProperty('--r', `${endRadius}px`);
    
    if (!document.startViewTransition) {
      document.documentElement.classList.toggle('dark');
      return;
    }
    
    document.startViewTransition(() => {
      document.documentElement.classList.toggle('dark');
    });
  });
</script>
```

### CSS

```css
/* Disable default View Transitions crossfade animation */
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

/* Ensure both states are fully visible */
::view-transition-old(root) {
  z-index: 1;
}

::view-transition-new(root) {
  z-index: 2;
  animation: reveal-circular 600ms ease-in-out;
}

@keyframes reveal-circular {
  from {
    clip-path: circle(0px at var(--x) var(--y));
  }
  to {
    clip-path: circle(var(--r) at var(--x) var(--y));
  }
}

/* Fallback for browsers without View Transitions */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-new(root) {
    animation-duration: 1ms;
  }
}
```

## External References

### Official Documentation

- **MDN Web Docs**: [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
  - Comprehensive guide covering all pseudo-elements and lifecycle
  - Browser compatibility table
  - Version: Updated through 2025

- **Chrome Developers Blog**: [Smooth transitions with the View Transitions API](https://developer.chrome.com/docs/web-platform/view-transitions/)
  - Official Chrome implementation guide
  - Performance best practices
  - Common patterns and examples

### Community Examples

- **Jake Archibald's Demos**: Various View Transitions demos on personal blog
  - Shows circular reveal pattern for theme switching
  - Covers edge cases and browser quirks

- **CSS-Tricks**: "Using View Transitions for Smooth Theme Changes"
  - Step-by-step tutorial
  - Addresses common mistakes

### Key Insights from Research

1. **Always disable default animations first** - Most tutorials skip this, leading to double animation
2. **Apply clip-path to new state, not old** - Old state should remain static
3. **Use calc() or JavaScript for exact radius** - 150% is approximation, exact math is better
4. **Test with reduced motion preference** - Some users need instant transitions

## Summary: Why Previous Attempts Failed

### Attempt 1: Pure Color Mask + Mix-Blend-Mode
- **Problem**: Solid color layer obscures content during animation
- **Why**: No dual-buffer, just overlay

### Attempt 2: View Transitions + Default Animation
- **Problem**: Content disappears on click, double animation
- **Why**: Didn't disable default crossfade (`animation: none` missing)

### Attempt 3: Border Ripple Only
- **Problem**: Only border animates, theme switches instantly
- **Why**: Not using View Transitions snapshots, just visual effect

## Correct Approach

Use View Transitions API as dual-buffer system:
1. Browser captures snapshot of old theme (auto)
2. JavaScript switches theme class
3. Browser captures snapshot of new theme (auto)
4. CSS animates new snapshot reveal with clip-path
5. Old snapshot stays visible underneath (opacity: 1)
6. Result: Smooth circular reveal from old to new

## Testing Checklist

- [ ] Click from center: circle expands evenly
- [ ] Click from corner: circle reaches opposite corner
- [ ] Click from edge: circle covers entire screen
- [ ] No flash/flicker during animation
- [ ] Content readable throughout animation
- [ ] Works in Chrome/Edge 111+
- [ ] Degrades gracefully in Safari/Firefox
- [ ] Respects `prefers-reduced-motion`
- [ ] No console errors
- [ ] Animation completes in ~600ms

## Next Steps for Implementation

1. Update `ThemeToggle.astro` with click position capture
2. Add CSS for disabling default animations
3. Add CSS for circular clip-path animation
4. Test in multiple browsers
5. Verify no content flash on click
6. Adjust animation timing (1500ms → 600ms for production)

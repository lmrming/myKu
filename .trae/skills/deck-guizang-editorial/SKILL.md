---
name: deck-guizang-editorial
description: "Magazine × e-ink editorial deck skill. Creates art-zine style presentations with 10 locked layouts and 5 palettes (Ink / Indigo Porcelain / Forest Ink / Kraft / Dune). Inspired by op7418/guizang-ppt-skill. Use when the user asks for a presentation, deck, slides, or editorial layout with a printed, artistic feel."
version: 1.0.0
recommended: 1
---

# Deck: Guizang Editorial

A magazine × e-ink editorial deck skill. Produces presentations that read like printed art-zines, not digital slide decks.

**Inspiration**: [`op7418/guizang-ppt-skill`](https://github.com/op7418/guizang-ppt-skill)

**Key traits**: 10 locked layouts × 5 palettes (Ink / Indigo Porcelain / Forest Ink / Kraft / Dune). High contrast, editorial typography, generous whitespace, deliberate asymmetry.

---

## When to use

- User asks for a "presentation", "deck", "slides", "pitch deck", "keynote"
- User wants something "editorial", "magazine-like", "printed", "artistic"
- User references "guizang", "龟藏", "e-ink", "editorial design"
- Content is story-driven, not data-heavy
- The deck should feel like a collector's item, not a corporate template

---

## The 5 Palettes

Each palette is designed for a specific mood. Pick based on content tone, not random rotation.

### 1. Ink (墨)
**Use for**: Literary content, poetry, philosophy, reflective topics
- Background: `#f7f5f0` (warm rice paper)
- Text: `#1a1a1a` (soft black)
- Accent: `#c41e3a` (cinnabar red)
- Secondary: `#8b7355` (ink wash)

### 2. Indigo Porcelain (青花)
**Use for**: Cultural topics, heritage, craftsmanship, ceramics
- Background: `#f0f4f8` (porcelain white)
- Text: `#1e3a5f` (indigo)
- Accent: `#4a90a4` (cobalt)
- Secondary: `#7a8b99` (faded blue)

### 3. Forest Ink (林墨)
**Use for**: Nature, environment, organic products, wellness
- Background: `#f5f3f0` (moss paper)
- Text: `#2d3a2d` (forest green)
- Accent: `#5a7a5a` (sage)
- Secondary: `#8b9a8b` (muted green)

### 4. Kraft (牛皮)
**Use for**: Handmade, artisanal, workshop, process documentation
- Background: `#e8e0d5` (kraft paper)
- Text: `#3d3229` (dark brown)
- Accent: `#b87333` (copper)
- Secondary: `#9a8b7a` (taupe)

### 5. Dune (沙丘)
**Use for**: Travel, architecture, minimalist design, future-forward
- Background: `#f5f0e8` (sand)
- Text: `#2d2d2d` (charcoal)
- Accent: `#c9a86c` (gold sand)
- Secondary: `#a89b8c` (warm gray)

---

## The 10 Locked Layouts

Each layout is a **composition pattern**, not a template to fill. Adapt content to fit the layout's rhythm.

### L1: Full Bleed Title
**Structure**: Single large typographic element, edge-to-edge
**Best for**: Opening slide, section breaks, dramatic statements
**Rules**: 
- One typeface only
- Size: 15–25% of viewport height
- Position: Asymmetric (never centered)
- Margin: Generous (min 10% viewport)

### L2: Asymmetric Split
**Structure**: 60/40 or 40/60 split, text on one side, negative space on other
**Best for**: Chapter openings, transition slides
**Rules**:
- Never 50/50
- Text block aligned to grid, not centered in its zone
- Accent element (line, dot, glyph) in negative space

### L3: Editorial Grid
**Structure**: 3-column grid (text | image | caption)
**Best for**: Product features, process steps, comparisons
**Rules**:
- Columns have distinct roles: narrative / visual / metadata
- Image bleeds to edge of its column
- Caption in smaller type, aligned to image bottom

### L4: Full Page Image + Overlay
**Structure**: Image fills frame, text in reserved zone (usually lower third)
**Best for**: Hero images, portfolio pieces, atmosphere setting
**Rules**:
- Text zone: 20–30% height, full width
- Background: Solid color from palette (not gradient overlay)
- Text: High contrast, generous padding

### L5: Typographic Poster
**Structure**: Large display type as image, body text as caption
**Best for**: Quotes, single powerful statements, typographic art
**Rules**:
- Display text: 30–40% viewport height
- Body text: Anchored to corner, not centered
- No images except the typography itself

### L6: Sequential Flow
**Structure**: Vertical rhythm of 3–5 items, each with number + title + line
**Best for**: Process, timeline, numbered lists
**Rules**:
- Numbers: Large, decorative, aligned left
- Connecting line: Thin, runs through all items
- Spacing: Equal, generous (min 2× line height between items)

### L7: Image Pair
**Structure**: Two images side by side, equal weight
**Best for**: Before/after, comparisons, diptychs
**Rules**:
- Gap: 2–4% of viewport width
- Images same aspect ratio
- Optional: Small caption below each, aligned left

### L8: Text + Marginalia
**Structure**: Main text block + sidebar notes in smaller type
**Best for**: Detailed content with asides, footnotes, annotations
**Rules**:
- Main: 60–70% width
- Marginalia: 20–25% width, aligned to top of main
- Marginalia type: 1–2 sizes smaller, lighter weight

### L9: Centered Statement
**Structure**: Single block of text, perfectly centered
**Best for**: Closing slides, thank you, calls to action
**Rules**:
- Max width: 60% of viewport
- Padding: Equal on all sides (min 15% viewport)
- Optional: Small decorative element above or below

### L10: Collage
**Structure**: 3–5 images of varying sizes, overlapping or touching
**Best for**: Mood boards, collections, visual essays
**Rules**:
- No strict grid—deliberate asymmetry
- One dominant image (40%+ of area)
- Text: Minimal, integrated into composition

---

## Typography

### Font Stack (CJK-first)

**Display / Headlines**:
```css
font-family: "Noto Serif SC", "Source Han Serif SC", "STSong", "SimSun", serif;
```

**Body / Text**:
```css
font-family: "Noto Sans SC", "Source Han Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
```

**Accent / Labels**:
```css
font-family: "IBM Plex Mono", "SF Mono", "Consolas", monospace;
```

### Type Scale

| Level | Size | Weight | Use |
|-------|------|--------|-----|
| Display | 48–72px | 700 | L1, L5 titles |
| Headline | 32–48px | 600 | Section headers |
| Subhead | 24–32px | 500 | L2, L9 statements |
| Body | 16–20px | 400 | Main text |
| Caption | 12–14px | 400 | L3 captions, marginalia |
| Label | 10–12px | 500 | Numbers, metadata |

---

## Spacing & Rhythm

### Base Unit
8px grid. All spacing is multiples of 8.

### Section Spacing
- Between slides: 0 (full viewport)
- Internal padding: 64–96px (8–12 units)
- Element gaps: 24–48px (3–6 units)

### Line Height
- Display: 1.1–1.2
- Headlines: 1.2–1.3
- Body: 1.6–1.8
- Captions: 1.4–1.5

---

## Visual Elements

### Rules & Lines
- Use 1px lines in accent color for separation
- Max 2 lines per slide
- Lines never span full width—intentional shortening

### Decorative Glyphs
- CJK punctuation as design elements: 「」【】……
- Used sparingly: 1–2 per deck
- Color: Accent or secondary

### Image Treatment
- No rounded corners
- No shadows
- Optional: 1px border in secondary color
- Aspect ratios: 3:2, 4:3, 1:1, 16:9 (consistent per deck)

---

## Interaction & Motion

### Default: Static
This skill defaults to **print-first, static output**. No animations unless explicitly requested.

### If Motion Requested
- Transitions: Simple fade or slide (300ms, ease-out)
- No continuous animations
- Respect `prefers-reduced-motion`

### Parallax Scroll (Optional Enhancement)
When user explicitly requests parallax or scroll-based animations:

**Implementation Approach**:
```css
/* CSS-only parallax using scroll-timeline (modern browsers) */
@supports (animation-timeline: scroll()) {
  .parallax-layer {
    animation: parallax-move linear;
    animation-timeline: scroll();
  }
  
  @keyframes parallax-move {
    from { transform: translateY(0); }
    to { transform: translateY(-50px); }
  }
}

/* Fallback: JavaScript Intersection Observer */
.parallax-element {
  will-change: transform;
  transition: transform 0.1s linear;
}
```

**Parallax Guidelines**:
- **Subtle only**: Max 30-50px movement range
- **Speed ratios**: Background 0.3x, Content 1x, Foreground 1.2x
- **Trigger**: Scroll position, not mouse movement
- **Performance**: Use `transform: translate3d()` for GPU acceleration
- **Mobile**: Disable on touch devices or use reduced motion
- **Respect**: Always check `prefers-reduced-motion: reduce`

**Layer Structure**:
```html
<section class="slide parallax-container">
  <div class="parallax-bg" data-speed="0.3">
    <!-- Background image -->
  </div>
  <div class="parallax-content" data-speed="1">
    <!-- Main content -->
  </div>
  <div class="parallax-fg" data-speed="1.2">
    <!-- Foreground accent -->
  </div>
</section>
```

**When to use**:
- Hero slides with atmospheric images
- Portfolio showcases
- Story-driven narratives
- **Avoid**: Data-heavy slides, text-focused content

**Anti-patterns**:
- ❌ Mouse-following parallax (distracting)
- ❌ Multiple elements moving at different speeds on same slide
- ❌ Large movement ranges (>100px)
- ❌ Parallax on every slide

---

## Output Format

### Single File HTML
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Deck Title]</title>
  <style>
    /* Palette variables */
    :root {
      --bg: #f7f5f0;
      --text: #1a1a1a;
      --accent: #c41e3a;
      --secondary: #8b7355;
    }
    
    /* Base styles */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: "Noto Sans SC", "PingFang SC", sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
    }
    
    /* Slide container */
    .slide {
      width: 100vw;
      height: 100vh;
      padding: 64px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    
    /* Layout classes */
    .layout-full-bleed { /* L1 */ }
    .layout-asymmetric { /* L2 */ }
    .layout-editorial-grid { /* L3 */ }
    /* ... etc */
  </style>
</head>
<body>
  <section class="slide layout-full-bleed">
    <!-- Content -->
  </section>
  
  <section class="slide layout-asymmetric">
    <!-- Content -->
  </section>
  
  <!-- More slides... -->
</body>
</html>
```

### Export Options
- **HTML**: Standalone file, open in browser
- **PDF**: Print → Save as PDF (use A4 or 16:9)
- **PNG**: Screenshot each slide (2× for retina)

---

## Quality Checklist

Before delivering, verify:

- [ ] Palette chosen matches content tone
- [ ] Layouts vary across slides (no repetition)
- [ ] Typography uses CJK-first stack
- [ ] Images have no rounded corners or shadows
- [ ] Spacing follows 8px grid
- [ ] Text contrast ≥ 4.5:1
- [ ] No corporate template feel
- [ ] Feels like a printed art-zine

---

## Example Prompts

**Good**:
- "Create a guizang-style deck about traditional Chinese tea ceremony"
- "Make an editorial presentation for my photography portfolio"
- "I need a magazine-style deck for my design process, use the Kraft palette"

**Avoid**:
- "Make a PowerPoint" (too generic)
- "I need slides with animations" (conflicts with static default)
- "Corporate presentation for Q3 earnings" (wrong tone—use a different skill)

---

## Anti-patterns

❌ **Never**:
- Use gradient backgrounds
- Add drop shadows to images
- Center everything
- Use stock photography without curation
- Include bullet points on every slide
- Animate for animation's sake

✅ **Always**:
- Treat each slide as a page in a magazine
- Let negative space breathe
- Use real content, not lorem ipsum
- Make deliberate asymmetry
- Respect the 8px grid

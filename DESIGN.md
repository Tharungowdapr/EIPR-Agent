---
name: EIPR-Agent
description: Multi-Agent AI System for Entrepreneurship & IP Rights Analysis
colors:
  primary: "#eab308"
  primary-hover: "#ca8a04"
  primary-light: "#fef9c3"
  primary-muted: "#a16207"
  bg-primary: "#0f0f13"
  bg-secondary: "#16161d"
  bg-tertiary: "#1c1c26"
  bg-hover: "#23232f"
  bg-card: "#1a1a24"
  border: "#2a2a3a"
  border-light: "#35354a"
  text-primary: "#f1f1f7"
  text-secondary: "#a0a0b8"
  text-muted: "#6b6b80"
  success: "#22c55e"
  warning: "#eab308"
  danger: "#ef4444"
  info: "#3b82f6"
typography:
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.2
  headline:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "clamp(1.25rem, 3vw, 1.75rem)"
    fontWeight: 600
    lineHeight: 1.3
  title:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.05em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
  xxxl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#0f0f13"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "#0f0f13"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
    border: "1px solid {colors.border}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
  card:
    backgroundColor: "{colors.bg-card}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "{spacing.xl}"
    border: "1px solid {colors.border}"
  input:
    backgroundColor: "{colors.bg-secondary}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
    border: "1px solid {colors.border}"
  badge:
    backgroundColor: "{colors.primary-muted}"
    textColor: "{colors.primary-light}"
    rounded: "9999px"
    padding: "2px 10px"
---

# Design System: EIPR-Agent

## 1. Overview

**Creative North Star: "The Lab Notebook"**

A scholar's workspace at midnight — deep, quiet, focused. Surfaces are dark and recede; content steps forward. The amber accent reads as annotation ink, not decoration — a scholar's highlighter on dense analysis. Every screen feels like a notebook spread: structured but never rigid, dense but never cluttered.

This system explicitly rejects the generic AI tool aesthetic — no chatbot bubbles, no sparkle motifs, no glassmorphism panels. It also rejects the SaaS-cream dark theme (purple gradients, neon accents). The palette is tonal and restrained; amber earns its place by scarcity.

**Key Characteristics:**
- Deep dark backgrounds with warm-toned neutrals (not cool gray)
- Single amber accent used sparingly (≤10% of any screen)
- Flat surfaces at rest, purposeful shadow on interaction
- Typography-led hierarchy — font weight and size carry structure, not colored boxes
- Content has room to breathe — generous whitespace between sections
- Borders describe containers; tonal shifts describe hierarchy

## 2. Colors

A warm-dark palette anchored by near-black surfaces with a subtle cool undertone, paired with a single amber accent that signals action and attention.

### Primary
- **Annotation Gold** (#eab308 / oklch(0.75 0.15 80)): Primary accent for buttons, active nav items, interactive states, and data emphasis. Used sparingly — its rarity is the point.
- **Annotation Gold Hover** (#ca8a04 / oklch(0.65 0.16 75)): Button hover state. Deepens the accent without shifting hue.
- **Annotation Gold Light** (#fef9c3 / oklch(0.95 0.03 90)): Text on dark amber backgrounds, badge text, subtle highlight.

### Neutral
- **Midnight Surface** (#0f0f13 / oklch(0.12 0.01 280)): Primary body background. The canvas.
- **Deep Slate** (#16161d / oklch(0.14 0.015 280)): Secondary surfaces (sidebar, input backgrounds).
- **Dark Well** (#1c1c26 / oklch(0.16 0.02 280)): Tertiary surfaces, dropdown menus.
- **Elevated Card** (#1a1a24 / oklch(0.15 0.02 280)): Card and container backgrounds.
- **Hover State** (#23232f / oklch(0.18 0.025 280)): Interactive hover states for list items, cards.
- **Border Subtle** (#2a2a3a / oklch(0.22 0.03 270)): Default borders.
- **Border Clear** (#35354a / oklch(0.28 0.035 270)): Focused/hovered borders.
- **Page Ink** (#f1f1f7 / oklch(0.92 0.01 280)): Primary body text.
- **Ink Faded** (#a0a0b8 / oklch(0.67 0.02 280)): Secondary text, metadata.
- **Ink Muted** (#6b6b80 / oklch(0.50 0.02 280)): Placeholder text, disabled states.

### Semantic
- **Success** (#22c55e / oklch(0.65 0.2 145)): Confirmation, completion badges.
- **Warning** (#eab308 / oklch(0.75 0.15 80)): Shared with primary — caution states reuse the accent.
- **Danger** (#ef4444 / oklch(0.60 0.22 30)): Destructive actions, error states.
- **Info** (#3b82f6 / oklch(0.55 0.15 270)): Informational notes, external links.

### Named Rules

**The One Voice Rule.** The amber accent appears on ≤10% of any given screen. It's reserved for primary actions, active state indicators, and data worth highlighting. If a screen has more than one amber element per viewport, each additional one must earn its place.

**The Dark Canvas Rule.** True black (#000) is forbidden as a surface color. All dark backgrounds hover in the oklch(0.10–0.20) range with a subtle hue lean. This keeps the dark mode feeling rich, not flat.

## 3. Typography

**Display Font:** Inter (system sans-serif fallback)
**Body Font:** Inter (system sans-serif fallback)
**Label/Mono Font:** Inter (numeric tabular data uses the same stack with `font-variant-numeric: tabular-nums`)

**Character:** A single clean sans-serif stack gives the interface a precise, no-nonsense feel. The wide range of Inter's weights (300–700) carries all the hierarchy needed — no secondary font required. The slight geometric coldness of Inter is warmed by the amber accent palette.

### Hierarchy
- **Display** (700, clamp(1.75rem, 4vw, 2.5rem), 1.2): Page-level headings (dashboard welcome, project title). One per page. Uses `text-wrap: balance`.
- **Headline** (600, clamp(1.25rem, 3vw, 1.75rem), 1.3): Section headings. Two to three per page.
- **Title** (600, 1rem, 1.4): Card titles, sidebar items, tab labels.
- **Body** (400, 0.875rem, 1.6): All running text, descriptions, metadata. Max line length 70ch.
- **Label** (500, 0.75rem, 1.4, 0.05em letter-spacing): Form labels, button text, badges. Usually uppercase.
- **Caption** (400, 0.75rem, 1.4): Secondary metadata, timestamps, helper text. Uses `text-wrap: pretty`.

### Named Rules
**The Single Stack Rule.** No secondary font family. Inter carries display through label. Hierarchy is expressed through weight, size, and spacing — never through a font swap.

## 4. Elevation

The interface uses a hybrid model: flat by default with tonal layering, and subtle shadows on hover states for interactive elements. Depth is primarily conveyed through background tone (lighter = higher), not through shadows. Shadows are a response to interaction, not a permanent surface property.

- **Resting surfaces** have no shadow. Containers are distinguished by background color and 1px borders.
- **Hover cards** (`.card-hover`) receive `box-shadow: 0 4px 24px rgba(0,0,0,0.25)` on hover, creating a gentle lift effect.
- **Modals and dropdowns** receive `box-shadow: 0 8px 32px rgba(0,0,0,0.35)` for clear separation from the page surface.
- **The glass utility** (`.glass`) uses `backdrop-filter: blur(24px)` with a semi-transparent background for floating UI like sticky headers.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadows appear only as a response to state (hover, focus, open). A card at rest should sit flush against its background; on hover it lifts.

## 5. Components

### Buttons
- **Shape:** Soft rectangle with 8px radius.
- **Primary:** Filled amber background (#eab308), dark text (#0f0f13), uppercase label. Hover: deeper amber (#ca8a04) with `translateY(-1px)` and `box-shadow: 0 4px 16px rgba(234,179,8,0.25)`. Active: push down (`translateY(0)`).
- **Secondary:** Transparent background, 1px border (#2a2a3a), light text (#f1f1f7). Hover: border brightens (#35354a), background shifts to hover state (#23232f).
- **Ghost:** No border or background, muted text (#a0a0b8). Hover: text brightens, background shifts to hover state (#23232f).
- **Danger:** Filled red background (#ef4444), white text. Reserved for destructive actions.
- **Transition:** All button transitions are 200ms ease-out.

### Cards
- **Shape:** Rounded corners (12px radius), 1px border (#2a2a3a).
- **Background:** Elevated Card (#1a1a24).
- **Shadow Strategy:** None at rest. Interactive cards (`.card-hover`) lift on hover with `box-shadow: 0 4px 24px rgba(0,0,0,0.25)` and border brightens to #35354a.
- **Internal Padding:** 24px (xl spacing scale).
- **No nested cards.** Cards are siblings, never children of another card.

### Inputs / Fields
- **Shape:** Soft rectangle (8px radius), 1px border (#2a2a3a), deep slate background (#16161d).
- **Focus:** Border shifts to amber (#eab308) with a subtle `box-shadow: 0 0 0 3px rgba(234,179,8,0.15)`.
- **Placeholder:** Ink Muted (#6b6b80) — must meet WCAG AA contrast against the input background.
- **Error:** Border shifts to danger (#ef4444) with matching shadow.
- **Disabled:** Opacity 50%, cursor not-allowed.

### Badges / Tags
- **Shape:** Fully rounded (9999px pill), 2px 10px horizontal padding.
- **Style:** Tinted background at 20% opacity of the semantic color with matching text at a lighter value. Five semantic variants: brand/amber, success/emerald, warning/yellow, danger/red, purple, orange.
- **Use:** For stage labels, status indicators, metadata tags. Never for primary navigation.

### Navigation (Sidebar)
- **Style:** Fixed left sidebar (240px), full viewport height, deep slate background (#16161d), right border (#2a2a3a).
- **Items:** 16px icon + label, muted text (#a0a0b8). Hover: text brightens, hover background (#23232f).
- **Active state:** Amber-tinted background (brand-600/15), amber text (#eab308), medium font weight.
- **Section headers:** 10px uppercase labels with wide tracking, muted color (#6b6b80).
- **User section:** Border-separated at bottom with avatar circle, name, email, and logout button.

### Step Indicators (Pipeline Stages)
- **Shape:** Icon + label row with small visual step markers.
- **States:** Active (amber text + icon), Completed (emerald text + icon), Pending (muted text + icon).
- **Layout:** Horizontal row across the project detail page, one per agent stage.

## 6. Do's and Don'ts

### Do:
- **Do** use the amber accent sparingly — one primary action per viewport is the target.
- **Do** let content breathe — use the full spacing scale between sections (24px–48px).
- **Do** use typographic hierarchy (weight, size) over colored containers to structure information.
- **Do** distinguish surfaces by background tone (lighter = higher), not by shadows.
- **Do** use `text-wrap: balance` on headings and `text-wrap: pretty` on body text.
- **Do** animate state changes with 200ms ease-out transitions.
- **Do** provide `@media (prefers-reduced-motion: reduce)` alternatives for all animations.

### Don't:
- **Don't** use chatbot bubbles, robot icons, sparkle motifs, or glassmorphism — this is an analytic engine, not a chat interface.
- **Don't** use the amber accent decoratively. Every amber element must signal action, state, or data worth highlighting.
- **Don't** create nested cards. Cards are siblings, never children.
- **Don't** use side-stripe borders (border-left or border-right ≥ 1px as a colored accent). Use full borders, background tints, or nothing.
- **Don't** apply gradient text (`background-clip: text + gradient`). Emphasis comes from weight and size.
- **Don't** use numbered section markers (01 / 02 / 03) as default scaffolding.
- **Don't** use tiny uppercase tracked eyebrow text above every section. One deliberate kicker is voice; one above every section is AI grammar.
- **Don't** use true black (#000) as a surface color.
- **Don't** let text overflow its container — test heading copy at every breakpoint.

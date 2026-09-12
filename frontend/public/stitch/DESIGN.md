---
name: Grid Harmonic
colors:
  surface: '#fff7ff'
  surface-dim: '#e0d7e3'
  surface-bright: '#fff7ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#faf1fc'
  surface-container: '#f4ebf7'
  surface-container-high: '#eee5f1'
  surface-container-highest: '#e8e0eb'
  on-surface: '#1e1a22'
  on-surface-variant: '#50434b'
  inverse-surface: '#332f37'
  inverse-on-surface: '#f7eef9'
  outline: '#81737c'
  outline-variant: '#d3c2cc'
  surface-tint: '#88487c'
  primary: '#260023'
  on-primary: '#ffffff'
  primary-container: '#450c3f'
  on-primary-container: '#bc75ad'
  inverse-primary: '#fbaee9'
  secondary: '#526615'
  on-secondary: '#ffffff'
  secondary-container: '#d4ed8d'
  on-secondary-container: '#586c1b'
  tertiary: '#0a1300'
  on-tertiary: '#ffffff'
  tertiary-container: '#1b2a00'
  on-tertiary-container: '#80945c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd7f2'
  primary-fixed-dim: '#fbaee9'
  on-primary-fixed: '#390134'
  on-primary-fixed-variant: '#6c3063'
  secondary-fixed: '#d4ed8d'
  secondary-fixed-dim: '#b8d074'
  on-secondary-fixed: '#161f00'
  on-secondary-fixed-variant: '#3b4d00'
  tertiary-fixed: '#d5ebaa'
  tertiary-fixed-dim: '#b9ce91'
  on-tertiary-fixed: '#131f00'
  on-tertiary-fixed-variant: '#3b4c1c'
  background: '#fff7ff'
  on-background: '#1e1a22'
  surface-variant: '#e8e0eb'
typography:
  display:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  title-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system serves a modern demand-flexibility energy platform bridging grid-level infrastructure with human-centered energy management. 

### Brand Personality & Core Mood
- **Trustworthy & Authoritative:** Conveys enterprise-grade reliability, security, and utility-scale precision through deep plum accents, disciplined layouts, and crisp structural boundaries.
- **Eco-Conscious & Optimistic:** Celebrates energy transition, renewable shifts, and carbon consciousness via a sharp, organic lime green highlight.
- **Pragmatic & Transparent:** Information is direct, legible, and unpretentious. The interface prioritizes clarity over visual gimmickry.

### Visual Style
A tailored blend of **Minimalism** and **Modern Precision**:
- **Zero Glassmorphism & Zero Gradients:** Every surface is rendered in solid, flat color. Visual priority is dictated by stark contrast and structural proportion rather than synthetic textures.
- **Architectural Clarity:** Layouts rely on flat white surfaces over a delicate off-white canvas, framed by precise 1px neutral borders (`#E5E5EB`).
- **High-Information Density with Breathing Room:** Dense telemetry, load shifting metrics, and schedules sit comfortably within a structured modular grid, ensuring effortless scanning for grid operators and enterprise energy managers alike.

## Colors

The palette is strictly restrained to two evocative brand anchors paired with high-clarity neutrals.

### Brand Roles
- **Primary (`#450C3F` - Deep Plum):** The institutional anchor. Used exclusively for top-tier headings, primary action buttons, active navigation markers, and decisive calls-to-action.
- **Secondary (`#B9D175` - Lime Green):** The ecological and operational catalyst. Used for renewable indicators, flexible load shifting milestones, positive delta values, secondary actions, and progress charts. Never used for long-form text.

### Neutral & Canvas Palette
- **Canvas / Background (`#F9F9FB`):** A clean, balanced cool off-white that prevents screen glare during prolonged monitoring.
- **Surface (`#FFFFFF`):** Pure white container surfaces for cards, tables, panels, and modal dialogs.
- **Text / Primary Neutral (`#1E1A22`):** Dark charcoal carrying near-black contrast without pure-black harshness, ensuring WCAG AAA legibility.
- **Text Muted (`#625D69`):** Mid-tone neutral for secondary labels, table headers, and supporting microcopy.
- **Border / Structural Lines (`#E5E5EB`):** Crisp, subtle boundary gray used consistently across cards, inputs, table rows, and panel dividers.

## Typography

Typography pairs the structural rigor of **Hanken Grotesk** for key hierarchy tiers with the utilitarian clarity of **Inter** for data tables, metrics, and microcopy.

- **Headings (Hanken Grotesk):** Tight letter tracking and confident weights set in deep plum (`#450C3F`) give platform telemetry an authoritative, modern feel.
- **Body & Data (Inter):** Neutral, hyper-legible rendering ensures zero fatigue during tabular data review, telemetry streams, and energy audit tracking.
- **Tabular Figures:** Always apply `font-feature-settings: "tnum" 1` for all time codes, megawatt figures, and percentage values to ensure uniform vertical column alignment.

## Layout & Spacing

The platform is structured on an **8pt base grid** designed to accommodate complex multi-pane operational dashboards and analytical views.

### Grid Architecture
- **Desktop (>= 1200px):** 12-column fluid grid. Column gutter is `1.5rem` (`24px`), outer canvas margin is `2rem` (`32px`) maxing out at `1440px` content width.
- **Tablet (768px - 1199px):** 8-column layout. Column gutter is `1.5rem` (`24px`), outer canvas margin is `1.5rem` (`24px`).
- **Mobile (< 768px):** 4-column layout. Column gutter is `1rem` (`16px`), outer canvas margin is `1rem` (`16px`). Dashboard charts and split-screen telemetry stacks collapse vertically.

### Rhythmic Padding
- Inner container padding strictly leverages `space-md` (`16px`) for compact operational modules and `space-lg` (`24px`) for primary analytical cards.
- Section separators rely on vertical margins using `space-xl` (`40px`).

## Elevation & Depth

To maintain an uncluttered, distraction-free environment, this design system rejects heavy blurs, diffusion shadows, and skeuomorphic layers.

### Low-Contrast Structural Boundaries
- **Primary Elevation (Flat Framing):** Visual depth is defined purely by planar separation. Pure white (`#FFFFFF`) containers sit directly on top of the clean off-white background (`#F9F9FB`), bounded by a single crisp 1px solid border (`#E5E5EB`).
- **Active & Hover States:** Hovering an interactive surface (such as a load-schedule card) shifts the border color from `#E5E5EB` to the primary brand plum `#450C3F` without vertical displacement.
- **Floating Overlays (Modals, Popovers, Drawers):** For essential overlays, depth is established using a high-density, crisp boundary border (`#1E1A22` at 15% opacity) accompanied by an ambient, low-profile drop: `0px 4px 16px rgba(30, 26, 34, 0.06)`. No colored glow or frosted glass effects are permitted.

## Shapes

The design uses a **Soft (Level 1)** geometric radius strategy, prioritizing structural discipline over casual rounding.

- **Base Radius (`0.25rem` / `4px`):** Applied to form fields, inline code snippets, data cells, checkboxes, and segmented controls.
- **Card & Modal Radius (`0.5rem` / `8px`):** Applied to metric widgets, analytical charts, modal frames, and dropdown menus.
- **Full Radius (Pill):** Reserved exclusively for status badges and event tags (e.g., "Curtailment Active", "Grid Optimal") to instantly differentiate semantic tags from interactive buttons.

## Components

### Buttons
- **Primary Button:** Background `#450C3F` (Deep Plum), text `#FFFFFF`, radius `4px`, padding `10px 20px`. Hover: darken plum by 6%. Focus: outline 2px solid `#B9D175` with 2px offset.
- **Secondary Button:** Background `#B9D175` (Lime Green), text `#1E1A22`, radius `4px`, padding `10px 20px`, font weight 600. Hover: lighten lime by 4%.
- **Outline / Tertiary Button:** Background transparent, border 1px solid `#E5E5EB`, text `#1E1A22`. Hover: border `#450C3F`, text `#450C3F`.

### Form Fields & Inputs
- Standard height: 40px.
- Background: `#FFFFFF`. Border: 1px solid `#E5E5EB`. Radius: `4px`. Text: `#1E1A22`.
- Focus state: Border 1.5px solid `#450C3F`, outline none.
- Helper & Error labels: Standard 12px Inter. Errors use deep neutral framing with an explicit icon rather than saturated unharmonized red.

### Checkboxes & Radio Controls
- Box size: 18x18px. Border: 1.5px solid `#E5E5EB`, radius 3px (or 50% for radio).
- Checked state: Fill `#450C3F` with white checkmark glyph. Focus: ring 2px `#B9D175`.

### Chips & Semantic Badges
- **Renewable / Flexible Badge:** Pill-shaped (`9999px`). Background `#B9D175` at 20% opacity (`#F1F6E3`), text `#2F3D13` (accessible deep green), border 1px solid `#B9D175`.
- **System Neutral Chip:** Background `#FFFFFF`, text `#1E1A22`, border 1px solid `#E5E5EB`.

### Cards & Telemetry Containers
- Background: `#FFFFFF`.
- Border: 1px solid `#E5E5EB`.
- Internal padding: `24px` (`space-lg`).
- Header area: Border-bottom 1px solid `#E5E5EB`, using `title-md` font weight 600.

### Lists & Data Tables
- Clean flat rows with alternating hover state `#F9F9FB`.
- Row border: Border-bottom 1px solid `#E5E5EB`.
- Header cells: Uppercase tracking (`label-sm`), color `#625D69`.

### Domain-Specific Components
- **Flexibility Event Gauge:** Crisp segmented bar charts utilizing `#B9D175` for dispatched flexible capacity and `#E5E5EB` for baseline capacity.
- **Grid Carbon Meter:** Flat numeric readout in Hanken Grotesk Display paired with a real-time status pip in solid `#B9D175` indicating high-renewable grid supply.
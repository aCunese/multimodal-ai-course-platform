---
name: Luminous AI Intelligence
colors:
  surface: '#faf8ff'
  surface-dim: '#d9d9e5'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3fe'
  surface-container: '#ededf9'
  surface-container-high: '#e7e7f3'
  surface-container-highest: '#e1e2ed'
  on-surface: '#191b23'
  on-surface-variant: '#434655'
  inverse-surface: '#2e3039'
  inverse-on-surface: '#f0f0fb'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#4b41e1'
  on-secondary: '#ffffff'
  secondary-container: '#645efb'
  on-secondary-container: '#fffbff'
  tertiary: '#6a1edb'
  on-tertiary: '#ffffff'
  tertiary-container: '#8343f4'
  on-tertiary-container: '#f7edff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c3c0ff'
  on-secondary-fixed: '#0f0069'
  on-secondary-fixed-variant: '#3323cc'
  tertiary-fixed: '#eaddff'
  tertiary-fixed-dim: '#d2bbff'
  on-tertiary-fixed: '#25005a'
  on-tertiary-fixed-variant: '#5a00c6'
  background: '#faf8ff'
  on-background: '#191b23'
  surface-variant: '#e1e2ed'
typography:
  display-title:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  module-title:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
  module-title-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  sidebar_width: 240px
  main_margin: 32px
  gutter: 24px
  card_padding: 24px
  stack_sm: 8px
  stack_md: 16px
  stack_lg: 32px
---

## Brand & Style

The design system is engineered for a **Multimodal AI Course Results Platform**, targeting students, researchers, and AI educators. The brand personality is **intelligent, luminous, and structured**. It balances the clinical precision of a developer tool with the accessibility of a modern educational platform.

The visual style is **Corporate Modern with Glassmorphism accents**. It utilizes a "Light Tech" aesthetic characterized by soft, multi-layered depth and a high-energy blue-violet spectrum. The interface should feel expansive and breathable, using white space to frame complex data visualizations and AI-generated outputs. Key emotional drivers are **clarity of information** and **technological optimism**.

## Colors

The palette is anchored by a high-fidelity **Blue-Violet triad**. 

- **Primary Spectrum:** A transition from Blue to Purple is used for interactive states, primary actions, and brand-defining moments like progress trackers and headers.
- **Surface Strategy:** The canvas uses a cool-toned light gray-white (#F6F8FC) to reduce eye strain and provide contrast for white cards.
- **Functional Accents:** Cyan is reserved for purely "tech" elements (e.g., AI confidence scores, scanning animations). Standard semantic colors (Green, Orange, Red) follow WCAG guidelines for accessibility in status reporting.

## Typography

This design system uses **Inter** (as a high-quality substitute for PingFang SC in global contexts) to maintain a clean, neutral, and highly legible information hierarchy.

- **Hierarchical Scaling:** Titles are weighted heavily (700) to anchor the card-based layout. 
- **Readability:** Body text is set at 14px-15px with generous line heights to ensure long-form AI descriptions remain approachable.
- **Multilingual Support:** When rendering Chinese characters, the system defaults to **PingFang SC** with equivalent weights to maintain the "Tech-Modern" look typical of leading Asian SaaS products.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** model optimized for dashboard density.

- **Sidebar:** A fixed 240px left-hand navigation allows for constant access to multimodal modules. It utilizes a subtle blur effect to separate it from the background.
- **Main Content:** A fluid area with a 32px safe-margin on all sides. Content is organized into a modular grid where cards typically span 4, 6, or 12 columns.
- **Rhythm:** An 8px base grid drives all internal component spacing (8/16/24/32), ensuring visual consistency across disparate modules like Sentiment Analysis and Image Recognition.

## Elevation & Depth

Hierarchy is established through **Soft-Layering** rather than heavy shadows.

- **Tier 1 (Base):** Canvas background (#F6F8FC).
- **Tier 2 (Cards):** Pure white (#FFFFFF) with a 20px corner radius and a "Soft Tech" shadow (0px 4px 20px rgba(0, 0, 0, 0.04)).
- **Tier 3 (Glassmorphic):** Semi-transparent white (opacity 70-80%) with a 16px backdrop-blur. Used for overlays, floating headers, or highlighted side panels to create a sense of "lightness" and advanced tech.
- **Interaction:** On hover, cards may lift slightly by increasing shadow spread and adding a 1px primary-colored subtle border.

## Shapes

The design system employs a **Generous Rounded** language to soften the "cold" nature of AI data.

- **Core Elements:** Cards use a significant 20px radius to create a friendly, approachable container.
- **Interactive Elements:** Buttons, inputs, and chips use a more standard 8px radius (Soft) to maintain a professional, utility-first feel within the cards.
- **Progress Indicators:** Use fully rounded (pill) caps for progress bars and circular indicators for confidence scores.

## Components

### Buttons
- **Primary:** Gradient background (Blue-Violet), white text, 8px radius. Features a soft glow shadow of the primary indigo.
- **Secondary:** White background with a 1px border (#E2E8F0), primary text color.
- **Action Icons:** 40x40px rounded squares with a light gray or subtle blue tint.

### Cards & Dashboards
- **Module Containers:** 20px radius, white background. Must include a clear header area with a module-specific icon.
- **Glass Overlays:** Used for "Live Results" or "Current Status" tags to signify real-time AI processing.

### Inputs & Selection
- **Fields:** 8px radius, light gray background (#F1F5F9) on idle, white background with blue border on focus.
- **Segmented Control:** Used for switching between AI model types; uses a "pill" within a container style.

### Data Visualization
- **Progress Bars:** 8px height, gradient fill for the active state, light gray for the track.
- **Confidence Gauges:** Circular strokes with Cyan (#06B6D4) for technical accuracy metrics.

### Feedback
- **Status Chips:** Small, highly rounded labels with low-opacity background tints (e.g., Success Green at 10% opacity) and high-contrast text.
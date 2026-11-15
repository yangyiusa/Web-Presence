---
name: ShelfWise
description: A University of Utah capstone presence with a live smoked-glass opening and readable project pages.
colors:
  ground: "#050507"
  glass: "#17171b"
  ink: "#dcdce0"
  ink-end: "#bdbdc3"
  copy: "rgba(255,255,255,.55)"
  metadata: "rgba(255,255,255,.34)"
  muted: "#9b9ba5"
  line: "#303037"
  action-hover: "#36d67e"
  focus: "#b9abff"
  selection: "#3679d9"
  button-ink: "#19191c"
  reading-copy: "#a8a8b3"
typography:
  display:
    fontFamily: "Inter, Arial, sans-serif"
    fontSize: "var(--display)"
    fontWeight: 500
    lineHeight: 0.97
    letterSpacing: "-0.045em"
  page-heading:
    fontFamily: "Inter, Arial, sans-serif"
    fontSize: "clamp(42px,5.5vw,82px)"
    fontWeight: 500
    lineHeight: 1.06
    letterSpacing: "-0.035em"
  section-heading:
    fontFamily: "Inter, Arial, sans-serif"
    fontSize: "clamp(27px,3vw,42px)"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Inter, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.8
  hero-copy:
    fontFamily: "Inter, Arial, sans-serif"
    fontSize: "var(--copy)"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "Inter, Arial, sans-serif"
    fontSize: "var(--small)"
    lineHeight: 1.3
    letterSpacing: "0.2em"
rounded:
  hero-action: "calc(6px * var(--s))"
  button: "6px"
  fallback-panel: "16px"
  header: "13px"
  media: "12px"
  portrait: "10px"
spacing:
  panel-gap: "14px"
  portrait-inset: "16px"
  content-inset: "var(--inset)"
  page-header-padding: "20px 38px"
  reading-section: "70px 0"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.button-ink}"
    rounded: "{rounded.hero-action}"
    width: "calc(116px * var(--s))"
    height: "calc(40px * var(--s))"
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
    textColor: "{colors.button-ink}"
  button-reading:
    backgroundColor: "{colors.ink}"
    textColor: "#17171c"
    rounded: "{rounded.button}"
    padding: "13px 17px"
  reveal-link:
    textColor: "#b8b8c0"
    padding: "10px 0"
  guide-tab:
    textColor: "#92929e"
    padding: "18px 12px"
  guide-tab-selected:
    textColor: "#e6e6ed"
    padding: "18px 12px"
---

# Design System: ShelfWise

## Overview

**Creative North Star: "Designed in glass"**

ShelfWise adapts the existing smoked-glass template into a capstone project presence. Near-black ground, pale Inter typography, quiet spectral reflections, and restrained green accents connect the opening to the dark editorial pages. The opening keeps its moving cut network, independent shard hover, and reversible shatter; long-form content uses normal document flow.

**Key Characteristics:**
- Live beveled glass on the opening, with selectable semantic text.
- Readable editorial layouts for project details, biographies, and instructions.
- Actual product screenshots and the supplied team photograph.
- Clear keyboard focus, reduced-motion fallback, and complete text content.

## Colors

**Primary:** Action green signals app actions, selected tutorial steps, active-page underlines, and small directional accents.

**Secondary:** Lavender marks keyboard focus, team role labels, and glass cursor emission. Selection blue is reserved for text selection.

**Neutral:** Near-black ground and smoked charcoal establish depth. Pale ink and its gradient end carry display text; reading copy and muted metadata provide hierarchy. Hairline dividers organize longer sections.

**The Printed Ink Rule.** Keep canvas lettering and semantic HTML synchronized, including hover and focus feedback.

## Typography

Inter variable supplies every role, with Arial and sans-serif fallbacks. Medium-weight, tightly tracked headings create continuity between the glass opening and reading pages. Body text is lighter and more generously spaced.

Hero display sizing follows the glass block: desktop uses the smaller of block width multiplied by .078 and panel height multiplied by .2. Portrait clamps to 46–80px at 12vw. The page-heading token is the desktop reading-page scale; below 700px it changes to a 38–63px clamp at 10vw. Reading copy reduces from 15px to 13px on small screens. Biographies use 13px text, reducing to 12px on mobile. Introductory copy stays near 44ch and story copy near 72ch.

## Layout

The desktop opening occupies 89vw by 83vh, centered with 5.5vw horizontal and 8.5vh vertical insets. Portrait uses a 16px outer inset and transposes the cut network. Navigation takes 10.8% of block height, or 9% in portrait, above a 14px gap. The internal content inset is block width multiplied by .056 on desktop and 26px in portrait. The opening stays viewport-bound; its project reveal scrolls vertically.

Reading pages share an 89%-wide header and footer. The content container is `calc(89% - 76px)`, capped at 1320px. Introductions split headline and supporting text; stories use a narrow caption column; biographies alternate portrait and copy; the tutorial pairs a wide screenshot with instructions. At 1000px gaps tighten. At 700px the navigation wraps to its own row and content grids stack; the content width becomes `calc(100% - 68px)`. Tutorial tabs scroll horizontally when needed. Product screenshots preserve their full image proportions.

## Elevation & Depth

The opening uses actual extrusions, beveled rims, room reflections, ACES filmic rendering, and a 30-degree perspective camera. Glass material roughness is .36, clearcoat .7, and base iridescence .55. Geometry scales with block width divided by 1730: rounded corners use 20 times scale, depth 13 times scale, and bevel size/thickness 2.6 times scale.

Reading pages use tonal gradients, strokes, and section dividers for depth. Their content remains visually quiet around photographs and screenshots. They do not borrow the animated shard transforms.

## Shapes

One rounded navigation slab sits above five rounded polygon shards. Convex offsets preserve dark seams as junctions drift. The return control is a small extruded irregular sliver. Reading pages retain gently rounded media, compact rounded buttons, and a shelf-line brand symbol. Article sections remain open rather than being enclosed in repeated cards.

## Components

**Navigation and actions.** About, Team, and Tutorial are real page links; current reading-page navigation has an underline and `aria-current`. Open app and Explore app lead to the supplied browser deployment at `https://shelfwise-nxbo.onrender.com/`, opening a new tab with `noopener noreferrer`. No download is required. Pale primary actions turn green on hover; keyboard focus has a lavender outline with a 6px offset. The secondary opening link underlines on hover.

**Live glass and project reveal.** Printed canvas textures and selectable DOM links share one source. UV raycasting activates the real link under each independently lifted shard. Non-corner junctions drift over 10–20 second periods, rebuilt at approximately 45 updates per second. Hover uses a damped spring and local tilt. Meet ShelfWise shatters the glass to reveal a concise project introduction and links; Back or Escape reassembles it. Focus moves to the reveal title and returns to the triggering link. Without JavaScript, the same anchor leads to About.

**Reading media and team.** Use the four actual application screenshots and the user-supplied team image. Portraits are CSS crops of that same photograph. The confirmed photo and biography order is Will Black, Conner Francis, Bradley Lund, Yi Yang. Each biography has a role label and explicitly unfinished degree/program and contact/LinkedIn fields. Asset origins and capture dates are recorded in [assets/README.md](assets/README.md); preserve them when updating media.

**Tutorial.** Five numbered tabs pair screenshots with short instructions, a step counter, and Previous/Next controls. Selected tabs use a green lower rule; the first Previous control is disabled. Arrow keys wrap between tabs, and Home/End select the first/last step. Selection updates `aria-selected`, roving `tabindex`, the panel label, alt text, and a polite live region. The complete ordered tutorial and native FAQ disclosures remain readable without JavaScript. Guest browsing and signed-in shopping lists are distinguished in the copy.

**Fallback and accessibility.** Initial reduced motion skips WebGL. Import/setup failure, context loss, or enabling reduced motion restores styled HTML; reduced-motion CSS removes animation and transitions. The opening retains real links, skip navigation, and focus management. About, Team, and the full text tutorial use ordinary HTML and remain useful without scripts.

## Do's and Don'ts

### Do:
- **Do** preserve the live opening and its synchronized semantic controls.
- **Do** keep long text in readable, scrolling editorial layouts.
- **Do** use actual screenshots and the supplied photograph with asset provenance.
- **Do** preserve explicit degree and contact placeholders until teammates supply details.
- **Do** retain full text instructions, keyboard tabs, and reduced-motion/static access.

### Don't:
- **Don't** substitute invented product screenshots or inferred personal details.
- **Don't** imply that planned project features were verified in the live application.
- **Don't** add download requirements to the linked browser workflow.

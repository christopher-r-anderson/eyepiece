# Styles compile at build time with Panda CSS

Status: accepted, 2026-07-13

## Context

The app started on Emotion, which was chosen deliberately. Runtime CSS-in-JS
still runs a lot of production code, and the project wanted two kinds of
experience with it: how a legacy styling model behaves under current React, and
how far it can lean on modern platform CSS. That second goal is why the design
tokens were plain CSS custom properties from the start rather than JS values.

The project is built on TanStack Start with streaming SSR, React 19, and React
Aria Components. The runtime nature of Emotion injecting styles during streamed
rendering produced hydration errors, flashes of unstyled content (a known
react-spectrum issue), and post-hydration rerenders. The RAC `Select`
component's styling in particular forced a dual-render workaround, with a
non-RAC placeholder on the server and a swap to the real component after
hydration. This meant maintaining rendering parity between two components with
different markup, API compromises around the component, and a loss of state
continuity across hydration.

Starting from modern tokens also limits what this migration demonstrates.
Because the tokens were already custom properties, the port skipped work a real
legacy codebase would face: JS-held token values, and runtime styling utilities
that would need moving to native CSS like `color-mix` and `calc`. Those are
baseline web features now, and artificially writing a legacy codebase just to
convert it was not deemed useful. The migration was therefore smaller than a
true legacy port would be, which was understood from the start.

The replacement had four requirements: build-time static CSS, current adoption
in greenfield work, a philosophy other than utility classes (utility-first is
deliberately explored in a separate project), and structure / patterns provided
by the tool rather than invented here (typed tokens, variants, conditions).

## Decision

Migrate to Panda CSS. Styles are extracted to static CSS at build time. Tokens
and semantic tokens live in the Panda config as the single source of truth. RAC
state styling maps to named conditions over the same data attributes the Emotion
code already targeted (`_hovered`, `_pressed`, `_selected`). The shared UI
components are config recipes whose classes land in a cascade layer below
utilities, so a caller's `css` prop override wins structurally instead of by
merge-rule convention. Components accept a typed override contract: a `css` prop
merged at the object level, with `className` accepted and merged for full
compatibility with existing tooling (TanStack Router's `createLink` utility in
particular expects to inject an active class name).

The migration ran in five staged PRs, each shipped to main: RAC idiom cleanup
first, then install, the UI layer, the app code, and finally removing Emotion.
The stated end condition was idiomatic Panda and idiomatic RAC with no cruft
left from before or during the migration path.

The dual-render `Select` workaround was deleted outright: with static CSS in the
document there is nothing to inject at hydration time. The migration removed a
net 454 lines.

## Alternatives considered

### StyleX

Meta's build-time system. It is a viable alternative and actively developed.
Rejected due to StyleX's approach of conditional style objects through render
props and outright restricting attribute selectors, which would have meant
giving up the data-attribute styling the codebase already relied on. In
addition, its Vite integration was noticeably less mature than its webpack
tooling at the time.

### vanilla-extract

Build-time, typed, and a reasonable fit. Not chosen due to its trajectory:
adoption has been flat since 2023, and the goal was to move to tools that are
still being actively chosen.

### CSS Modules with modern CSS

A strong candidate that comfortably aligns with a web native approach. However,
it ships without built-in patterns such as typed tokens, variants, and
conditions, requiring them to be invented in-project. Inventing them here was a
stated non-goal.

### Tailwind

Ruled out at the requirements level rather than on merit: a utility-class
approach is deliberately explored elsewhere, and the point of this styling layer
is the token-and-recipe philosophy.

## Consequences

- Styles must be statically analyzable. Computed values move into tokens or CSS
  custom properties, and the extractor's failure mode is silent: a style object
  it cannot see emits no CSS and no error. That property produced real bugs
  during the migration and led to a guard test asserting every declared recipe
  variant has generated CSS.
- The cascade-layer ordering retired a class of merge rules. Under Emotion,
  wrapper components needed conventions about merge order and property-key forms
  for overrides to resolve predictably. With recipes in a layer below utilities,
  override precedence is structural.
- Two footguns led to explicit patterns to avoid repeating:
  - Panda does not reconcile a shorthand and its longhand across merged objects,
    so both classes ship and stylesheet order decides (determined by layer order
    combined with Panda's property sorting). Component bases uniformly use
    shorthands where callers override.
  - TanStack's `createLink` injects a default `className` on active links, so a
    component that replaces instead of merges `className` silently loses its
    styles.
- The Panda-plus-RAC pairing leaves a mix of factory-generated and hand-written
  components, since the `styled()` factory cannot carry generics or component
  logic. That mix matches how the main Panda-based component libraries are built
  and is the accepted shape, not a leftover.
- The build gains a codegen step, and the generated `styled-system/` directory
  is gitignored and rebuilt on install.
- The SSR problem class is eliminated entirely. Styles ship in the document and
  the select renders correctly from the server with no client-side swap.

# Styling

Styles are Panda CSS, compiled at build time, with `strictTokens` and
`strictPropertyValues` on. The shared components and their variants render
in the `/dev/ui` gallery through the real app shell; there is deliberately
no Storybook. Why Panda: [the styling decision](./decisions/03-styling.md).

The reviewer-facing rules distilled from this doc live in the
[styleguide](../STYLEGUIDE.md).

## Where Styles Live

- Tokens and semantic tokens: `panda/*.ts` only. Raw `var(--x)` theme
  values are banned in styles; compound values use `token(...)` refs.
- Component variants: config recipes in component-adjacent `*.recipe.ts`
  files. Multi-part components use slot recipes; logic-free components bind
  with `styled()` one-liners.
- App and page code styles inline with `css()` and patterns. Hoist only for
  reuse or genuinely unwieldy blocks.
- Runtime-computed values (virtualizer positions, view-transition names) go
  to `style=`. A constant needed by both CSS and runtime code becomes a
  token: `token(...)` in the style object, `token('...')` from
  `styled-system/tokens` at runtime.

## Extraction

Panda emits only the CSS it can see statically, and misses are silent. The
contract:

- An inline object in a `css` prop needs no wrapper.
- Any stored style object is wrapped in `css.raw(...)` at its definition,
  same file or not.
- Call `css()` only where the className string is consumed.
- A cross-file `css.raw` object is safe only as a top-level `css()` or
  `css.raw()` argument. Pairs under a nested selector must appear literally
  under that selector somewhere, or their conditioned classes are never
  generated.
- Values must be literals. A computed value (`` `${ROW_HEIGHT}px` ``) is
  silently dropped; use the token bridge above instead.
- Config-evaluated modules (`*.recipe.ts`, `*.styles.ts`) sit outside this
  contract: they cannot import `styled-system`, so shared style objects
  there are typed with `as const satisfies` instead (see
  `button.styles.ts`).

## Overrides

- Overrideable ui primitives take `css` and `className` (`StyleProps`);
  fixed-surface components (ModalDialog, Sheet) deliberately expose
  neither. Recipe-backed primitives render
  `cx(recipe(...), css(cssProp), className)`: the css prop beats the recipe
  by layer order. Components with plain utility bases merge object-level -
  `css(base, cssProp)` - because conflicting classes from separate `css()`
  calls resolve by stylesheet order, not merge order.
- Wrappers with defaults destructure `css` and merge
  `css.raw(defaults, css)`. A spread carrying the prop either clobbers the
  defaults or drops the caller's value.
- Shorthand and longhand forms of one property do not reconcile across a
  merge: both classes ship and longhands sort later. Bases use shorthands
  for commonly overridden properties (padding, margin); overrides use the
  base's exact keys.
- Layer order: plain recipes beat slot recipes regardless of specificity,
  and utilities beat both. Cross-recipe overrides go in the `css` prop,
  never a second recipe class on the same element.

## Tokens and Escapes

- Under `strictTokens`, token-backed properties take tokens; genuine
  one-offs take `[bracketed]` values. The escape is deliberate and
  greppable - keep it rare. `token(...)` refs resolve inside brackets.
- Don't bracket keywords a utility special-cases: `outline: 'none'`
  compiles to an invisible 2px outline so forced-colors mode keeps a focus
  indicator, and a bracketed `[none]` would bypass that.
- Component-local custom properties (`--toggle-icon-*`, `--button-icon-*`)
  are the channel for theming a component from a composing recipe: declared
  in `globalVars`, read with token fallbacks.

## Variants

- Recurring, conventional patterns become variants even at one use; genuine
  one-offs stay `css` overrides, optionally wrapped in a named component.
- Variant values selected at runtime (a drilled or computed prop) carry
  scoped `staticCss` for those values: JIT extraction only sees literal
  call sites, so a runtime-only variant's CSS is silently missing while the
  code still type-checks. Values that always appear as literals need
  nothing (`button.recipe.ts` covers only its drilled `text` value).
- Heading has two axes: `level` is semantic (the tag), `size` is visual
  scale (`title-lg` | `title-md` | `display-md`). The component skips the
  level scale when `size` is set.

## States

- React Aria states style through the named conditions (`_hovered`,
  `_pressed`, `_focused`, `_selected`). `_pressed` and `_selected` bind to
  data attributes only: `aria-pressed` reflects toggled state, not a
  momentary press.
- Overlay entrance animations use literal `[data-entering]` selectors on
  the element carrying the state.
- Text inputs match `:focus-visible` on mouse focus; use
  `data-focus-visible`.

## Container Queries

- The asset tile is the width-query user: it declares
  `containerType: 'inline-size'` and hides its action pill under
  `@container (max-width: 104px)`, so the behavior tracks the tile's own
  width, not the viewport.
- `containerType` is also declared where container units need to resolve:
  the sheet sizes its content in `cqh` (a percentage cannot see the fixed
  container's height), as does the asset-detail box.
- Rule of thumb: kind is declared (variant), width is measured (query),
  context owns width, the component owns behavior within it.

## Spacing

- ui components never carry sibling-spacing margins. Parents own spacing
  via `gap`; heading space binds to what follows. Separator is the
  exception (spacing is its role, and menus rely on its margins);
  self-centering like Form's `margin: '0 auto'` is placement, not spacing.
- Globals keep element appearance only, never sibling-spacing rules.

## Headings

- Exactly one `h1` per page, owned by the page component: rendered directly
  or delegated to the child that carries the title text
  (`headingLevel={1}`). Content inside a titled page defaults to level 2.
- Heading slots (`heading={...}`) when the caller owns the text;
  `headingLevel` threading when the component owns the text but not its
  place. Modals root their own outline at `titleLevel` (default 2).
- Nested data (cause chains) gets one heading, never a heading per depth.

## Forms

- Forms are stacked grids capped at `formMax`. The `surface` variant
  (`plain` | `panel`) is drilled per usage site.
- Layout never lives on a child in the parent's axis; `FormActions` owns
  the actions row.

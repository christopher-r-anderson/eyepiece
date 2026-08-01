import { execSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { buttonRecipe } from './button.recipe'
import { formRecipe } from './form.recipe'
import { headingRecipe } from './heading.recipe'
import { linkRecipe } from './link.recipe'
import { menuItemRecipe, menuRecipe } from './menus.recipe'
import { modalDialogRecipe } from './modal-dialog.recipe'
import { popoverRecipe } from './popover.recipe'
import { searchFieldRecipe } from './search-field.recipe'
import { separatorRecipe } from './separator.recipe'
import { sheetRecipe } from './sheet.recipe'
import { switchRecipe } from './switch.recipe'
import { tabsRecipe } from './tabs.recipe'
import { textFieldRecipe } from './text-field.recipe'
import { toastRecipe } from './toast.recipe'
import { toggleButtonRecipe } from './toggle-button.recipe'

const recipes = [
  buttonRecipe,
  formRecipe,
  headingRecipe,
  linkRecipe,
  menuRecipe,
  menuItemRecipe,
  popoverRecipe,
  searchFieldRecipe,
  separatorRecipe,
  switchRecipe,
  toggleButtonRecipe,
]

const slotRecipes = [
  modalDialogRecipe,
  sheetRecipe,
  tabsRecipe,
  textFieldRecipe,
  toastRecipe,
]

let sheet = ''

beforeAll(() => {
  const outfile = join(mkdtempSync(join(tmpdir(), 'recipe-css-')), 'styles.css')
  execSync(`pnpm panda cssgen --outfile ${outfile}`, { stdio: 'pipe' })
  sheet = readFileSync(outfile, 'utf8')
}, 120_000)

// the documented "off" values of two-value axes: an empty style object is
// the point, not dead vocabulary
// layout_action leaves with the two-column retirement (#195)
const EMPTY_VALUE_ALLOWLIST = new Set([
  'form--surface_plain',
  'form--layout_action',
])

// a variant declared on a recipe is part of the component's typed api, but
// jit only emits css for values it can see (literal call sites or staticCss).
// a failure here means dead vocabulary: delete the variant or cover it
describe('every declared recipe variant has generated css', () => {
  for (const recipe of recipes) {
    const variants = Object.entries(recipe.variants ?? {})

    for (const [axis, values] of variants) {
      for (const [value, styles] of Object.entries(values)) {
        const name = `${recipe.className}--${axis}_${value}`
        if (Object.keys(styles).length === 0) {
          it(`${name} is a documented off value`, () => {
            expect(EMPTY_VALUE_ALLOWLIST).toContain(name)
          })
          continue
        }

        it(name, () => {
          expect(sheet).toContain(`.${name}`)
        })
      }
    }
  }

  for (const recipe of slotRecipes) {
    for (const slot of recipe.slots) {
      const base = recipe.base?.[slot] ?? {}

      if (Object.keys(base).length === 0) {
        continue
      }

      it(`${recipe.className}__${slot}`, () => {
        expect(sheet).toContain(`.${recipe.className}__${slot}`)
      })
    }
  }
})

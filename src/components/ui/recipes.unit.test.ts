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
import { switchRecipe } from './switch.recipe'
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

const slotRecipes = [modalDialogRecipe, textFieldRecipe, toastRecipe]

let sheet = ''

beforeAll(() => {
  const outfile = join(mkdtempSync(join(tmpdir(), 'recipe-css-')), 'styles.css')
  execSync(`pnpm panda cssgen --outfile ${outfile}`, { stdio: 'pipe' })
  sheet = readFileSync(outfile, 'utf8')
}, 120_000)

// a variant declared on a recipe is part of the component's typed api, but
// jit only emits css for values it can see (literal call sites or staticCss).
// a failure here means dead vocabulary: delete the variant or cover it
describe('every declared recipe variant has generated css', () => {
  for (const recipe of recipes) {
    const variants = Object.entries(recipe.variants ?? {})

    for (const [axis, values] of variants) {
      for (const [value, styles] of Object.entries(values)) {
        if (Object.keys(styles).length === 0) {
          continue
        }

        it(`${recipe.className}--${axis}_${value}`, () => {
          expect(sheet).toContain(`.${recipe.className}--${axis}_${value}`)
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

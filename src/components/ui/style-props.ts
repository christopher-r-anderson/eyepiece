import { styled } from 'styled-system/jsx'
import type { ComponentProps, ComponentType } from 'react'
import type { SystemStyleObject } from 'styled-system/types'

// the style surface of every ui component: a css override merged as utility
// classes (winning over recipe styles by cascade layer) and a className
// appended after the generated classes, never replacing them
export type StyleProps = {
  css?: SystemStyleObject
  className?: string
}

// the full contract for components wrapping an underlying element/component:
// replaces the wrapped className (react aria types it as
// `string | (renderProps) => string`; the render-function form is
// unsupported on purpose - state styling belongs in data-attribute
// conditions) with the plain-string surface above
export type UiProps<TProps> = Omit<TProps, 'className'> & StyleProps

export type UiComponent<TComponent extends ComponentType<any>> = ComponentType<
  UiProps<ComponentProps<TComponent>>
>

// styled() with the factory's surface narrowed to the ui contract: the cast
// hides the factory's wider className union and array-form css prop while
// keeping the recipe's variant props (carried on the generated __type).
// runtime behavior is styled() untouched; this is the single assertion site
export function uiStyled<
  TComponent extends ComponentType<any>,
  TRecipe extends { __type: unknown },
>(
  component: TComponent,
  recipe: TRecipe,
): ComponentType<UiProps<ComponentProps<TComponent>> & TRecipe['__type']> {
  return styled(component, recipe as never) as unknown as ComponentType<
    UiProps<ComponentProps<TComponent>> & TRecipe['__type']
  >
}

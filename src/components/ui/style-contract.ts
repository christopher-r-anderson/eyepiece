import { styled } from 'styled-system/jsx'
import type { ComponentProps, ComponentType } from 'react'
import type { SystemStyleObject } from 'styled-system/types'

export type StyleProps = {
  css?: SystemStyleObject
  className?: string
}

// narrows the wrapped component's className (react aria types it as
// `string | (renderProps) => string`) to a plain string - state styling
// belongs in data-attribute conditions
export type UiProps<TProps> = Omit<TProps, 'className'> & StyleProps

export type UiComponent<TComponent extends ComponentType<any>> = ComponentType<
  UiProps<ComponentProps<TComponent>>
>

// styled() narrowed to the ui contract, keeping the recipe's variant props
// (carried on the generated __type). runtime behavior is styled() untouched;
// this is the single assertion site
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

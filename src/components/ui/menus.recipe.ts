import { defineRecipe } from '@pandacss/dev'

export const menuRecipe = defineRecipe({
  className: 'menu',
  base: {
    backgroundColor: 'bg.surface.2',
    display: 'flex',
    flexDirection: 'column',
    minWidth: '12rem',
    borderRadius: 'inherit',
    overflow: 'hidden',
    // focus ring still shows *on the first menu item* when opening the menu via the keyboard
    '&:focus': {
      outline: 'none',
    },
  },
})

export const menuItemRecipe = defineRecipe({
  className: 'menu-item',
  base: {
    color: 'text',
    // href items render as anchors; keep the prose underline off them
    textDecoration: 'none',
    paddingBlock: '2',
    paddingInline: '4',
    borderRadius: 'sm',
    cursor: 'pointer',
    _hovered: {
      backgroundColor: 'bg.surface.3',
      color: 'text',
    },
    outline: 'none',
    _focused: {
      outline: 'none',
    },
    _focusVisible: {
      outline: 'focusRing',
    },
  },
})

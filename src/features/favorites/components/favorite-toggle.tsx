import { StarIcon } from '@phosphor-icons/react/dist/ssr'
import type { ToggleButtonProps } from '@/components/ui/toggle-button'
import { ToggleButton } from '@/components/ui/toggle-button'

const favoriteToggleCss = {
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: '#6a6a6a',
  '&[data-hovered="true"]': {
    color: '#ffdf00',
  },
}

export function FavoriteToggle({ ...props }: ToggleButtonProps) {
  return (
    <ToggleButton {...props} aria-label="Star" css={favoriteToggleCss}>
      <StarIcon size={18} weight={props.isSelected ? 'fill' : undefined} />
    </ToggleButton>
  )
}

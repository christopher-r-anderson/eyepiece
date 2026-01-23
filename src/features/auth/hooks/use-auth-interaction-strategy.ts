import { useMatches } from '@tanstack/react-router'

export function useAuthInteractionStrategy() {
  const strategy = useMatches({
    select: (matches) =>
      matches.findLast(({ staticData }) => staticData.authInteractionStrategy)
        ?.staticData.authInteractionStrategy,
  })
  return strategy || 'modal'
}

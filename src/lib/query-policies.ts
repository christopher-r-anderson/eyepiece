// grid list queries refresh on mount only: their tiles hold removal ghosts
// or anchor the add-to-collection popover, and any background refetch
// (focus, reconnect) could yank rows out from under the interaction
export const mountOnlyListFreshness = {
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const

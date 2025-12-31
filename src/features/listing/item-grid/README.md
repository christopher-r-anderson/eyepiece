# GridList

## Outstanding Issues

There is a @tanstack/react-virtual issue that causes a `flushSync` during render error. As discussed at this PR (which is expected to be changed or rejected) <https://github.com/TanStack/virtual/pull/1098> and this further comment <https://github.com/TanStack/virtual/issues/1094#issuecomment-3695050885> in another ticket, this is a chosen path of calling a sync change during render to avoid a potential ui flicker.

New PR at <https://github.com/TanStack/virtual/pull/1100> to allow disabling of `flushSync`. This is currently patched locally, but not committed. Following this PR and releases to enable once the official option is available as there is no noticeable flicker with this patched. If that is noticed in the future, this can be revisited.

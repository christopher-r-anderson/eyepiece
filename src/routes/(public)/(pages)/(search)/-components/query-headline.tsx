import { css } from 'styled-system/css'

export function QueryHeadline({ query }: { query: string }) {
  return (
    <h1
      className={css({
        textStyle: 'display.lg',
        overflowWrap: 'anywhere',
        animationName: 'settle',
        animationDuration: 'orchestrated',
        animationTimingFunction: 'settle',
        animationFillMode: 'backwards',
        _motionReduce: { animation: 'none' },
      })}
    >
      {query}
    </h1>
  )
}

import { createContext, useContext, useMemo } from 'react'
import type { CSSProperties, ComponentPropsWithoutRef, ReactNode } from 'react'

type StackContextValue = {
  activeKey: string
}

const StackContext = createContext<StackContextValue | null>(null)

export type StableVisibilityStackProps = {
  activeKey: string
  children: ReactNode
} & Omit<ComponentPropsWithoutRef<'div'>, 'children'>

export const StableVisibilityStack = ({
  activeKey,
  children,
  style,
  ...rest
}: StableVisibilityStackProps) => {
  const contextValue = useMemo(() => ({ activeKey }), [activeKey])

  return (
    <StackContext.Provider value={contextValue}>
      <div
        {...rest}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gridTemplateRows: '1fr',
          ...style,
        }}
      >
        {children}
      </div>
    </StackContext.Provider>
  )
}

export type StableVisibilityStackItemProps = {
  itemKey: string
  children: ReactNode
  justify?: CSSProperties['justifySelf']
  align?: CSSProperties['alignSelf']
} & Omit<ComponentPropsWithoutRef<'div'>, 'children'>

export const StableVisibilityStackItem = ({
  itemKey,
  justify = 'stretch',
  align = 'stretch',
  children,
  style,
  ...props
}: StableVisibilityStackItemProps) => {
  const context = useContext(StackContext)

  if (!context) {
    throw new Error(
      'StableVisibilityStackItem must be used within a StableVisibilityStack',
    )
  }

  const isVisible = context.activeKey === itemKey

  return (
    <div
      inert={isVisible ? undefined : true}
      {...props}
      style={{
        gridArea: '1 / 1',
        opacity: isVisible ? undefined : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
        justifySelf: justify,
        alignSelf: align,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

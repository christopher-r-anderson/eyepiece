import { createLink } from '@tanstack/react-router'
import { Link as ReactAriaLink } from 'react-aria-components'
import type { LinkProps } from 'react-aria-components'

const linkStyles = {
  textDecoration: 'none',
  '&[data-hovered]': { textDecoration: 'underline' },
}

function AppLink(props: LinkProps) {
  return <ReactAriaLink css={linkStyles} {...props} />
}

export const Link = createLink(AppLink)

// type NestedLinkProps<T extends ElementType = 'a'> = AriaLinkOptions & {
//   elementType?: T
//   children?: ReactNode
//   className?: string
//   style?: React.CSSProperties
// } & Omit<
//     ComponentPropsWithRef<T>,
//     keyof AriaLinkOptions | 'children' | 'className' | 'style'
//   >

// function NestedAppLink<T extends ElementType = 'a'>({
//   children,
//   className,
//   ref,
//   style,
//   elementType,
//   ...props
// }: NestedLinkProps<T>) {
//   const objectRef = useObjectRef(ref)
//   const Tag = (elementType || 'a') as ElementType
//   const domProps = filterDOMProps(props)
//   const { linkProps } = useLink(props, ref)

//   return (
//     <Tag
//       ref={objectRef}
//       {...mergeProps(domProps, linkProps, { className, style })}
//       tabIndex={-1}
//     >
//       {children}
//     </Tag>
//   )
// }

// export const NestedLink = createLink(NestedAppLink)

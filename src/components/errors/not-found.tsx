import { PageHeading } from '@/components/page-heading'

export function NotFound({
  title,
  message,
}: {
  title: string
  message: string
}) {
  return (
    <>
      <PageHeading>{title}</PageHeading>
      <p>{message}</p>
    </>
  )
}

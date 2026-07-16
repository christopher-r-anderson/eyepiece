import { useMemo } from 'react'
// aliased: a JSX element named VisuallyHidden matches Panda's built-in
// pattern and emits a dead .sr_true rule
import { VisuallyHidden as RacVisuallyHidden } from 'react-aria'
import { css } from 'styled-system/css'
import type { Metadata } from '@/domain/asset/asset.schema'

type Row = { key: string; value: unknown }

function objectToRows(obj: Metadata): Array<Row> {
  return Object.entries(obj)
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => a.key.localeCompare(b.key))
}

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export function MetadataTable({ data }: { data: Metadata }) {
  const rows = useMemo(() => objectToRows(data), [data])
  return (
    <div>
      <table
        className={css({
          border: 'default',
          width: '100%',
          borderCollapse: 'collapse',
          '& thead': {
            borderBottom: 'default',
            backgroundColor: 'secondary.bg',
            color: 'secondary.text',
          },
          '& th, & td': {
            padding: '2',
          },
          '& th:first-of-type': {
            borderRight: 'default',
          },
          '& tr': {
            backgroundColor: 'secondary.bg',
            color: 'secondary.text',
          },
          '& tbody tr:nth-of-type(odd)': {
            backgroundColor: 'tertiary.bg',
          },
        })}
      >
        <caption>
          <RacVisuallyHidden>Image metadata</RacVisuallyHidden>
        </caption>
        <thead>
          <tr>
            <th scope="col">Key</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ key, value }) => (
            <tr key={key}>
              <th
                scope="row"
                className={css({ textAlign: 'left', verticalAlign: 'top' })}
              >
                <code>{key}</code>
              </th>
              <td className={css({ verticalAlign: 'top' })}>
                {safeStringify(value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

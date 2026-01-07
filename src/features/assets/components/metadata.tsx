import { EyepieceMetadata } from '@/lib/api/eyepiece/types'
import { useMemo } from 'react'
import { VisuallyHidden } from 'react-aria'

type Row = { key: string; value: unknown }

function objectToRows(obj: EyepieceMetadata): Row[] {
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

export function MetadataTable({ data }: { data: EyepieceMetadata }) {
  const rows = useMemo(() => objectToRows(data), [data])
  return (
    <div>
      <table
        css={{
          border: '1px solid var(--border-color)',
          width: '100%',
          borderCollapse: 'collapse',
          thead: {
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--secondary-bg)',
            color: 'var(--secondary-text)',
          },
          'th, td': {
            padding: '0.5rem',
          },
          'th:first-of-type': {
            borderRight: '1px solid var(--border-color)',
          },
          tr: {
            backgroundColor: 'var(--secondary-bg)',
            color: 'var(--secondary-text)',
          },
          'tbody tr:nth-of-type(odd)': {
            backgroundColor:
              'oklch(from var(--secondary-bg) calc(l + 0.1) c h)',
          },
        }}
      >
        <caption>
          <VisuallyHidden>Image metadata</VisuallyHidden>
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
              <th scope="row" css={{ textAlign: 'left', verticalAlign: 'top' }}>
                <code>{key}</code>
              </th>
              <td css={{ verticalAlign: 'top' }}>{safeStringify(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

import { createContext, useContext, useMemo } from 'react'
import { createEyepieceClient } from './client'
import type { EyepieceClient } from './client'
import type { ReactNode } from 'react'

const EyepieceClientContext = createContext<EyepieceClient | null>(null)

export function EyepieceClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => createEyepieceClient({ origin: '' }), [])

  return (
    <EyepieceClientContext.Provider value={client}>
      {children}
    </EyepieceClientContext.Provider>
  )
}

export function useEyepieceClient() {
  const client = useContext(EyepieceClientContext)
  if (!client) throw new Error('EyepieceClientProvider missing')
  return client
}

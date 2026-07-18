import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// testing-library only self-registers cleanup when a global afterEach
// exists at import time; without globals: true that never happens
afterEach(cleanup)

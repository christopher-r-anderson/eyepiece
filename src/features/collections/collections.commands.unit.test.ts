import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeCollectionsCommands } from './collections.commands'
import { CollectionsErrorCodes } from './collections.const'
import {
  addCollectionItemFn,
  createCollectionFn,
  deleteCollectionFn,
  removeCollectionItemFn,
  renameCollectionFn,
  setCollectionVisibilityFn,
} from './collections.functions'
import type { Collection } from './collections.schema'
import { resultIsError, resultIsSuccess } from '@/lib/result'

// ---------------------------------------------------------------------------
// collections.functions is mocked at the top level so that importing
// collections.commands never triggers collections.functions' module-scope
// createServerFn() calls.
// ---------------------------------------------------------------------------

vi.mock('./collections.functions', () => ({
  createCollectionFn: vi.fn(),
  renameCollectionFn: vi.fn(),
  setCollectionVisibilityFn: vi.fn(),
  deleteCollectionFn: vi.fn(),
  addCollectionItemFn: vi.fn(),
  addCollectionItemAtPositionFn: vi.fn(),
  removeCollectionItemFn: vi.fn(),
}))

const mockCreateCollectionFn = vi.mocked(createCollectionFn)

const COLLECTION_ID = '550e8400-e29b-41d4-a716-446655440001'

const COLLECTION: Collection = {
  id: COLLECTION_ID,
  ownerId: '550e8400-e29b-41d4-a716-446655440002',
  name: 'lunar landscapes',
  visibility: 'private',
  createdAt: '2026-07-26T00:00:00+00:00',
  updatedAt: '2026-07-26T00:00:00+00:00',
}

const CREATE_INPUT = {
  name: 'lunar landscapes',
  visibility: 'private',
} as const

describe('makeCollectionsCommands().createCollection', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns Ok wrapping the resolved value on success', async () => {
    mockCreateCollectionFn.mockResolvedValueOnce(COLLECTION)
    const commands = makeCollectionsCommands()

    const result = await commands.createCollection(CREATE_INPUT)

    expect(resultIsSuccess(result)).toBe(true)
    if (resultIsSuccess(result)) {
      expect(result.data).toEqual(COLLECTION)
    }
  })

  it('calls createCollectionFn with { data: input }', async () => {
    mockCreateCollectionFn.mockResolvedValueOnce(COLLECTION)
    const commands = makeCollectionsCommands()

    await commands.createCollection(CREATE_INPUT)

    expect(mockCreateCollectionFn).toHaveBeenCalledOnce()
    expect(mockCreateCollectionFn).toHaveBeenCalledWith({ data: CREATE_INPUT })
  })

  it('returns Err with the error message and cause when an Error is thrown', async () => {
    const thrown = new Error('not authenticated')
    mockCreateCollectionFn.mockRejectedValueOnce(thrown)
    const commands = makeCollectionsCommands()

    const result = await commands.createCollection(CREATE_INPUT)

    expect(resultIsError(result)).toBe(true)
    if (resultIsError(result)) {
      expect(result.error.message).toBe('not authenticated')
      expect(result.error.cause).toBe(thrown)
    }
  })

  it('preserves AppException-style codes when the server throws handled errors', async () => {
    const thrown = Object.assign(
      new Error(CollectionsErrorCodes.AUTH_REQUIRED),
      {
        name: 'AppException',
        appError: {
          code: CollectionsErrorCodes.AUTH_REQUIRED,
          message: CollectionsErrorCodes.AUTH_REQUIRED,
        },
      },
    )
    mockCreateCollectionFn.mockRejectedValueOnce(thrown)
    const commands = makeCollectionsCommands()

    const result = await commands.createCollection(CREATE_INPUT)

    expect(resultIsError(result)).toBe(true)
    if (resultIsError(result)) {
      expect(result.error.code).toBe(CollectionsErrorCodes.AUTH_REQUIRED)
      expect(result.error.message).toBe(CollectionsErrorCodes.AUTH_REQUIRED)
    }
  })

  it('drops codes outside the collections error vocabulary', async () => {
    const thrown = Object.assign(new Error('some feature error'), {
      name: 'AppException',
      appError: {
        code: 'SOME_OTHER_CODE',
        message: 'some feature error',
      },
    })
    mockCreateCollectionFn.mockRejectedValueOnce(thrown)
    const commands = makeCollectionsCommands()

    const result = await commands.createCollection(CREATE_INPUT)

    expect(resultIsError(result)).toBe(true)
    if (resultIsError(result)) {
      expect(result.error.code).toBeUndefined()
      expect(result.error.message).toBe('some feature error')
    }
  })

  it('returns Err with a fallback message when a non-Error is thrown', async () => {
    mockCreateCollectionFn.mockRejectedValueOnce('oops plain string')
    const commands = makeCollectionsCommands()

    const result = await commands.createCollection(CREATE_INPUT)

    expect(resultIsError(result)).toBe(true)
    if (resultIsError(result)) {
      expect(result.error.message).toBe(
        'An unknown (and invalid) error occurred',
      )
      expect(result.error.cause).toBe('oops plain string')
    }
  })
})

describe('makeCollectionsCommands() delegation', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('routes every command to its server function with { data: input }', async () => {
    const commands = makeCollectionsCommands()
    const itemInput = {
      collectionId: COLLECTION_ID,
      assetKey: {
        providerId: 'nasa_ivl',
        externalId: 'ARC-1998-AC98-0418-6',
      },
    } as const
    const calls = [
      {
        run: () =>
          commands.renameCollection({
            collectionId: COLLECTION_ID,
            name: 'renamed',
          }),
        fn: vi.mocked(renameCollectionFn),
        input: { collectionId: COLLECTION_ID, name: 'renamed' },
      },
      {
        run: () =>
          commands.setCollectionVisibility({
            collectionId: COLLECTION_ID,
            visibility: 'public',
          }),
        fn: vi.mocked(setCollectionVisibilityFn),
        input: { collectionId: COLLECTION_ID, visibility: 'public' },
      },
      {
        run: () => commands.deleteCollection({ collectionId: COLLECTION_ID }),
        fn: vi.mocked(deleteCollectionFn),
        input: { collectionId: COLLECTION_ID },
      },
      {
        run: () => commands.addCollectionItem(itemInput),
        fn: vi.mocked(addCollectionItemFn),
        input: itemInput,
      },
      {
        run: () => commands.removeCollectionItem(itemInput),
        fn: vi.mocked(removeCollectionItemFn),
        input: itemInput,
      },
    ]

    for (const { run, fn, input } of calls) {
      await run()
      expect(fn).toHaveBeenCalledOnce()
      expect(fn).toHaveBeenCalledWith({ data: input })
    }
  })
})

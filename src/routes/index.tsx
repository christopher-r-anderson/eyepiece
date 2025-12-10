import { SearchPage } from '@/features/search/components/SearchPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: SearchPage })

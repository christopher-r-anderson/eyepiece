#!/usr/bin/env bash

set -euo pipefail

echo "# Add these to your .env.local and .env.test files:"
echo

pnpm supabase status -o env 2>/dev/null \
  | grep -E '^(API_URL|PUBLISHABLE_KEY|SECRET_KEY)=' \
  | sed \
    -e 's/^API_URL=/VITE_SUPABASE_URL=/' \
    -e 's/^PUBLISHABLE_KEY=/VITE_SUPABASE_PUBLISHABLE_KEY=/' \
    -e 's/^SECRET_KEY=/SUPABASE_SECRET_KEY=/'

echo

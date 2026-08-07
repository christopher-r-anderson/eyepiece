// On-demand axe-core pass over one URL per template, in both color schemes.
//
//   pnpm audit:axe
//   pnpm audit:axe --base http://localhost:8888 --only home,login
//
// Results land in audit-reports/ (gitignored); violations print per page.
import fs from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { AxeBuilder } from '@axe-core/playwright'
import { chromium } from '@playwright/test'
import { DESKTOP_UA, resolveAuditTargets } from './audit-targets'

const { values } = parseArgs({
  // pnpm forwards a literal "--" when invoked as `pnpm audit:axe -- --x`
  args: process.argv
    .slice(2)
    .filter((arg, index) => !(index === 0 && arg === '--')),
  options: {
    base: { type: 'string', default: 'https://eyepiece.net' },
    only: { type: 'string' },
  },
})

const baseUrl = values.base.replace(/\/$/, '')
if (!/^https?:\/\//.test(baseUrl))
  throw new Error(`--base must include http:// or https://`)

async function main() {
  const targets = (await resolveAuditTargets(baseUrl)).filter(
    (target) => !target.auth,
  )
  const only = values.only?.split(',')
  const unknown = only?.filter(
    (name) => !targets.some((target) => target.name === name),
  )
  if (unknown && unknown.length > 0)
    throw new Error(`--only: unknown template(s): ${unknown.join(', ')}`)
  const selected = only
    ? targets.filter((target) => only.includes(target.name))
    : targets
  if (selected.length === 0) throw new Error(`--only matched no targets`)

  const stamp = `${new Date().toISOString().replace(/[:.]/g, '-').replace('Z', '')}-${process.pid}`
  const outDir = path.join(
    'audit-reports',
    `axe-${new URL(baseUrl).hostname}-${stamp}`,
  )
  fs.mkdirSync(outDir, { recursive: true })
  process.stdout.write(`auditing ${baseUrl} -> ${outDir}\n`)

  const browser = await chromium.launch()
  let totalViolations = 0
  let pageErrors = 0
  try {
    for (const colorScheme of ['light', 'dark'] as const) {
      const context = await browser.newContext({
        userAgent: DESKTOP_UA,
        colorScheme,
        viewport: { width: 1440, height: 900 },
      })
      for (const target of selected) {
        const page = await context.newPage()
        const response = await page.goto(`${baseUrl}${target.path}`, {
          waitUntil: 'load',
        })
        if (!response || !response.ok()) {
          process.stdout.write(
            `${target.name}.${colorScheme}: HTTP ${response?.status() ?? '?'}, skipping\n`,
          )
          pageErrors++
          await page.close()
          continue
        }
        try {
          await page.waitForFunction(
            (conditions) =>
              conditions.every(
                ({ selector, count }) =>
                  document.querySelectorAll(selector).length >= (count ?? 1),
              ),
            target.ready,
            { timeout: 30_000 },
          )
        } catch {
          process.stdout.write(
            `${target.name}.${colorScheme}: page never settled, skipping\n`,
          )
          pageErrors++
          await page.close()
          continue
        }
        // let streamed sections settle; don't fail on long-lived connections
        await page
          .waitForLoadState('networkidle', { timeout: 15_000 })
          .catch(() => {})
        // target-size (WCAG 2.2 AA) ships disabled by default in axe-core
        const results = await new AxeBuilder({ page })
          .options({ rules: { 'target-size': { enabled: true } } })
          .analyze()
        const name = `${target.name}.${colorScheme}`
        fs.writeFileSync(
          path.join(outDir, `${name}.json`),
          `${JSON.stringify(results, null, 2)}\n`,
        )
        totalViolations += results.violations.length
        process.stdout.write(
          `${name}: ${results.violations.length} violations\n`,
        )
        for (const violation of results.violations) {
          process.stdout.write(
            `  [${violation.impact ?? 'unknown'}] ${violation.id} x${violation.nodes.length}: ${violation.help}\n`,
          )
        }
        await page.close()
      }
      await context.close()
    }
  } finally {
    await browser.close()
  }
  process.stdout.write(
    `\n${totalViolations} violations total across pages and color schemes\n`,
  )
  if (pageErrors > 0) {
    process.stdout.write(`${pageErrors} pages skipped without auditing\n`)
  }
  if (totalViolations > 0 || pageErrors > 0) process.exitCode = 1
}

await main()

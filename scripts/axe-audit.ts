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
import {
  DESKTOP_UA,
  cliArgs,
  makeReportDir,
  parseBaseUrl,
  selectAuditTargets,
  waitForReady,
} from './audit-targets'

const { values } = parseArgs({
  args: cliArgs(),
  options: {
    base: { type: 'string', default: 'https://eyepiece.net' },
    only: { type: 'string' },
  },
})

const baseUrl = parseBaseUrl(values.base)

async function main() {
  const selected = await selectAuditTargets(baseUrl, values.only)
  const outDir = makeReportDir('axe', baseUrl)
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
        const name = `${target.name}.${colorScheme}`
        const page = await context.newPage()
        try {
          const response = await page.goto(`${baseUrl}${target.path}`, {
            waitUntil: 'load',
          })
          if (!response || !response.ok()) {
            throw new Error(`HTTP ${response?.status() ?? 'error'}`)
          }
          await waitForReady(page, target)
        } catch (error) {
          process.stdout.write(
            `${name}: skipped, page errored or never settled (${String(error).slice(0, 120)})\n`,
          )
          pageErrors++
          await page.close()
          continue
        }
        // let image loads finish; don't fail on long-lived connections
        await page
          .waitForLoadState('networkidle', { timeout: 15_000 })
          .catch(() => {})
        // target-size (WCAG 2.2 AA) ships disabled by default in axe-core
        const results = await new AxeBuilder({ page })
          .options({ rules: { 'target-size': { enabled: true } } })
          .analyze()
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

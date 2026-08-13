// On-demand Lighthouse pass over one URL per template. Not a CI gate: scores
// depend on live provider calls and would flake.
//
//   pnpm audit:lighthouse                          # production, mobile+desktop
//   pnpm audit:lighthouse --base http://localhost:8888 --runs 3
//   pnpm audit:lighthouse --form-factor mobile --only home,search-all
//
// Reports and a summary land in audit-reports/ (gitignored).
import fs from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { chromium } from '@playwright/test'
import { launch } from 'chrome-launcher'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'
import {
  DESKTOP_UA,
  MOBILE_UA,
  cliArgs,
  makeReportDir,
  parseBaseUrl,
  selectAuditTargets,
  waitForReady,
} from './audit-targets'
import type { AuditTarget } from './audit-targets'
import type { Browser, BrowserContext } from '@playwright/test'
import type { Flags, Result } from 'lighthouse'

const { values } = parseArgs({
  args: cliArgs(),
  options: {
    base: { type: 'string', default: 'https://eyepiece.net' },
    runs: { type: 'string', default: '1' },
    'form-factor': { type: 'string', default: 'both' },
    only: { type: 'string' },
  },
})

const baseUrl = parseBaseUrl(values.base)
const runs = Number(values.runs)
if (!Number.isInteger(runs) || runs < 1)
  throw new Error(`--runs must be a positive integer`)
const formFactorArg = values['form-factor']
if (
  formFactorArg !== 'both' &&
  formFactorArg !== 'mobile' &&
  formFactorArg !== 'desktop'
) {
  throw new Error(`--form-factor must be mobile, desktop, or both`)
}
const formFactors: Array<'mobile' | 'desktop'> =
  formFactorArg === 'both' ? ['mobile', 'desktop'] : [formFactorArg]

const configs = {
  mobile: {
    extends: 'lighthouse:default',
    settings: { emulatedUserAgent: MOBILE_UA },
  },
  desktop: {
    ...desktopConfig,
    settings: { ...desktopConfig.settings, emulatedUserAgent: DESKTOP_UA },
  },
}

interface RunSummary {
  template: string
  formFactor: string
  run: number
  scores: Record<string, number | null>
  metrics: Record<string, number | undefined>
  failedRequests: Array<string>
  failingAudits: Array<{
    id: string
    title: string
    score: number
    displayValue?: string
  }>
}

function summarize(
  template: string,
  formFactor: string,
  run: number,
  lhr: Result,
): RunSummary {
  const metric = (id: string) => lhr.audits[id]?.numericValue
  const requestItems =
    (
      lhr.audits['network-requests']?.details as
        | { items?: Array<Record<string, unknown>> }
        | undefined
    )?.items ?? []
  const failedRequests = requestItems
    .filter(
      (item) =>
        item.finished === false ||
        (typeof item.statusCode === 'number' &&
          (item.statusCode < 0 || item.statusCode >= 400)),
    )
    .map((item) => `${String(item.statusCode)} ${String(item.url)}`)
  const failingAudits = Object.values(lhr.audits)
    .filter(
      (audit) =>
        audit.score !== null &&
        audit.score < 0.9 &&
        (audit.scoreDisplayMode === 'binary' ||
          audit.scoreDisplayMode === 'numeric' ||
          audit.scoreDisplayMode === 'metricSavings'),
    )
    .map((audit) => ({
      id: audit.id,
      title: audit.title,
      score: audit.score as number,
      displayValue: audit.displayValue,
    }))
  return {
    template,
    formFactor,
    run,
    scores: Object.fromEntries(
      Object.entries(lhr.categories).map(([id, category]) => [
        id,
        category.score,
      ]),
    ),
    metrics: {
      firstContentfulPaintMs: metric('first-contentful-paint'),
      largestContentfulPaintMs: metric('largest-contentful-paint'),
      cumulativeLayoutShift: metric('cumulative-layout-shift'),
      totalBlockingTimeMs: metric('total-blocking-time'),
      speedIndexMs: metric('speed-index'),
      serverResponseTimeMs: metric('server-response-time'),
    },
    failedRequests,
    failingAudits,
  }
}

async function launchChrome() {
  const chromeFlags = ['--headless=new', `--user-agent=${DESKTOP_UA}`]
  try {
    return await launch({ chromeFlags })
  } catch {
    // no system chrome; fall back to playwright's browser, whose build
    // cannot sandbox on distros restricting unprivileged user namespaces
    return launch({
      chromePath: chromium.executablePath(),
      chromeFlags: [...chromeFlags, '--no-sandbox'],
    })
  }
}

// lighthouse cannot wait on app readiness mid-run, so a probe rules out error
// documents and streamed sections that never settle before any report is
// accepted; the audited navigations themselves stay unguarded, and a run that
// stalls anyway surfaces through its failed-request count
async function pageSettles(
  context: BrowserContext,
  url: string,
  target: AuditTarget,
) {
  const page = await context.newPage()
  try {
    // domcontentloaded, not load: a hung image must not reject an
    // otherwise settled page
    const response = await page.goto(url, { waitUntil: 'domcontentloaded' })
    if (!response || !response.ok()) return false
    await waitForReady(page, target)
    return true
  } catch {
    return false
  } finally {
    await page.close()
  }
}

async function main() {
  const selected = await selectAuditTargets(baseUrl, values.only)
  const outDir = makeReportDir('lighthouse', baseUrl)
  process.stdout.write(`auditing ${baseUrl} -> ${outDir}\n`)

  const summaries: Array<RunSummary> = []
  let pageErrors = 0
  const chrome = await launchChrome()
  let probeBrowser: Browser | undefined
  try {
    probeBrowser = await chromium.launch()
    const probeContext = await probeBrowser.newContext({
      userAgent: DESKTOP_UA,
    })
    const flags: Flags = {
      port: chrome.port,
      output: ['json', 'html'],
      logLevel: 'error',
    }
    for (const target of selected) {
      const url = `${baseUrl}${target.path}`
      if (!(await pageSettles(probeContext, url, target))) {
        process.stdout.write(
          `${target.name}: page errored or never settled, skipping\n`,
        )
        pageErrors += formFactors.length * runs
        continue
      }
      for (const formFactor of formFactors) {
        for (let run = 1; run <= runs; run++) {
          const result = await lighthouse(url, flags, configs[formFactor])
          if (!result)
            throw new Error(`lighthouse returned no result for ${url}`)
          const name = `${target.name}.${formFactor}.run${run}`
          if (result.lhr.runtimeError) {
            process.stdout.write(
              `${name}: ${result.lhr.runtimeError.code} ${result.lhr.runtimeError.message}\n`,
            )
            pageErrors++
            continue
          }
          const [json, html] = result.report as [string, string]
          fs.writeFileSync(path.join(outDir, `${name}.report.json`), json)
          fs.writeFileSync(path.join(outDir, `${name}.report.html`), html)
          const summary = summarize(target.name, formFactor, run, result.lhr)
          summaries.push(summary)
          const scores = Object.entries(summary.scores)
            .map(
              ([id, score]) =>
                `${id} ${score === null ? '-' : Math.round(score * 100)}`,
            )
            .join('  ')
          process.stdout.write(`${name}: ${scores}\n`)
          if (summary.failedRequests.length > 0) {
            process.stdout.write(
              `  failed requests: ${summary.failedRequests.length}\n`,
            )
          }
        }
      }
    }
  } finally {
    await chrome.kill()
    await probeBrowser?.close()
  }

  fs.writeFileSync(
    path.join(outDir, 'summary.json'),
    `${JSON.stringify(summaries, null, 2)}\n`,
  )
  process.stdout.write(
    `\n| template | factor | run | perf | a11y | best | seo | LCP ms | CLS | TBT ms |\n`,
  )
  process.stdout.write(
    `| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n`,
  )
  for (const summary of summaries) {
    const score = (id: string) => {
      const value = summary.scores[id]
      return value == null ? '-' : Math.round(value * 100)
    }
    process.stdout.write(
      `| ${summary.template} | ${summary.formFactor} | ${summary.run} | ${score('performance')} | ${score('accessibility')} | ${score('best-practices')} | ${score('seo')} | ${Math.round(summary.metrics.largestContentfulPaintMs ?? -1)} | ${(summary.metrics.cumulativeLayoutShift ?? -1).toFixed(3)} | ${Math.round(summary.metrics.totalBlockingTimeMs ?? -1)} |\n`,
    )
  }
  if (pageErrors > 0) {
    process.stdout.write(`\n${pageErrors} runs failed without a report\n`)
    process.exitCode = 1
  }
}

await main()

/* ------------------------------------------------------------------
   WordLegal — स्वचालित UI परीक्षण (Playwright)
   लाइब्रेरी, संपादक, शब्दकोश, प्रारूप, पूर्वावलोकन, PDF/DOCX निर्यात
   ------------------------------------------------------------------ */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const OUT = 'artifacts'
const SCREENS = path.join(OUT, 'screens')
fs.mkdirSync(SCREENS, { recursive: true })

const PORT = 4183
const URL = `http://127.0.0.1:${PORT}/`

const problems = []
const notes = []

function ok(msg) { notes.push('✔ ' + msg); console.log('✔ ' + msg) }
function bad(msg) { problems.push(msg); console.log('✘ ' + msg) }

async function waitServer() {
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch(URL)
      if (r.ok) return
    } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error('preview server did not start')
}

const server = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['vite', 'preview', '--port', String(PORT), '--host', '127.0.0.1', '--strictPort'],
  { stdio: 'ignore', detached: false },
)

let browser
try {
  await waitServer()
  ok('preview server started')
  browser = await chromium.launch()

  async function newPage(width, height, label) {
    const ctx = await browser.newContext({
      viewport: { width, height },
      acceptDownloads: true,
      deviceScaleFactor: 1,
      locale: 'hi-IN',
    })
    const page = await ctx.newPage()
    page.setDefaultTimeout(45000)
    page.on('pageerror', (e) => bad(`[${label}] pageerror: ${e.message}`))
    page.on('console', (m) => {
      if (m.type() !== 'error') return
      const t = m.text()
      if (/favicon|Download the React DevTools|Spring|Capacitor/i.test(t)) return
      bad(`[${label}] console: ${t.slice(0, 240)}`)
    })
    await page.goto(URL, { waitUntil: 'networkidle' })
    return page
  }

  const shot = async (page, name, full = false) => {
    await page.waitForTimeout(350)
    await page.screenshot({ path: path.join(SCREENS, `${name}.png`), fullPage: full })
  }

  /* ===================== 1. टैबलेट — पूरा प्रवाह ================== */
  const page = await newPage(1600, 1000, 'tablet')

  if (await page.locator('.doc-card.quick').isVisible()) ok('library rendered')
  else bad('library did not render')
  await shot(page, '01-library-tablet')

  // भाषा/फ़ॉन्ट जाँच
  const title = await page.title()
  if (title.includes('वर्डलीगल')) ok('hindi title present')
  else bad('title missing: ' + title)

  // नया खाली लीगल मसौदा
  await page.locator('.doc-card.quick').click()
  await page.waitForSelector('.paper .ProseMirror')
  await page.waitForTimeout(900)

  const geom = await page.evaluate(() => {
    const p = document.querySelector('.paper')
    const cs = p ? getComputedStyle(p) : null
    return {
      w: p ? p.getBoundingClientRect().width : 0,
      h: p ? p.getBoundingClientRect().height : 0,
      font: cs?.fontFamily ?? '',
      hasCourt: !!document.querySelector('.doc-court'),
      ratio: p ? p.getBoundingClientRect().width / p.getBoundingClientRect().height : 0,
    }
  })
  notes.push('paper ' + JSON.stringify(geom))
  if (Math.abs(geom.ratio - 8.5 / 14) < 0.03) ok('legal page ratio 8.5:14 (scaled)')
  else bad('page ratio not legal: ' + geom.ratio.toFixed(3))
  if (geom.font.includes('Noto')) ok('devanagari font active')
  else bad('font not Noto: ' + geom.font)
  if (geom.hasCourt) ok('court heading block present')
  else bad('court heading missing')

  await shot(page, '02-editor-blank-tablet')

  // टाइपिंग (देवनागरी सहित)
  const pm = page.locator('.paper .ProseMirror')
  await pm.click()
  await page.keyboard.press('Control+End')
  await page.keyboard.type('हिन्दी विधिक परीक्षण — धारा 480 बी.एन.एस.एस. के अंतर्गत।')
  await page.waitForTimeout(900)
  const typed = await pm.innerText()
  if (typed.includes('हिन्दी विधिक परीक्षण')) ok('hindi typing works')
  else bad('typing failed')

  // ऑटोसेव
  const saved = await page.locator('.save-pill').innerText()
  if (saved.includes('सहेजा गया')) ok('autosave indicator saved')
  else notes.push('save pill: ' + saved)

  // रिबन टैब
  for (const [tab, name] of [['लेआउट', '03-ribbon-layout'], ['विधिक', '04-ribbon-legal'], ['सम्मिलित करें', '05-ribbon-insert']]) {
    await page.getByRole('button', { name: tab, exact: true }).first().click()
    await page.waitForTimeout(250)
    await shot(page, name + '-tablet')
  }

  // शब्दकोश
  await page.locator('button[title="शब्दकोश"]').first().click()
  await page.waitForSelector('.sheet .search')
  await page.locator('.sheet .search').fill('जमानत')
  await page.waitForTimeout(500)
  const rows = await page.locator('.dict-row').count()
  if (rows > 0) ok(`dictionary search works (${rows} results for जमानत)`)
  else bad('dictionary search returned no rows')
  await shot(page, '06-dictionary-tablet')

  await page.locator('.dict-row').first().click()
  await page.waitForTimeout(300)
  await shot(page, '07-dictionary-detail')
  await page.getByRole('button', { name: 'दस्तावेज़ में जोड़ें' }).click()
  await page.waitForTimeout(600)
  const afterDict = await pm.innerText()
  if (afterDict.includes('ज़मानत') || afterDict.includes('जमानत')) ok('dictionary word inserted into document')
  else bad('dictionary insert failed')

  // केस विवरण
  await page.locator('.topbar button[title="अधिक"]').click()
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: 'केस विवरण भरें' }).click()
  await page.waitForSelector('.sheet')
  await page.waitForTimeout(300)
  await shot(page, '08-case-details-tablet')
  await page.getByPlaceholder('स्थान / जिला').fill('राजस्थान, जयपुर')
  await page.getByPlaceholder('अधिवक्ता का नाम').fill('श्री रामकिशोर शर्मा')
  await page.getByPlaceholder('प्रार्थी का नाम').fill('मोहन लाल')
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: 'सभी फ़ील्ड भरें' }).click()
  await page.waitForTimeout(600)
  await page.locator('.sheet-head button[title="बंद करें"]').click()
  await page.waitForTimeout(400)
  const filled = await pm.innerText()
  if (filled.includes('जयपुर') || filled.includes('मोहन लाल')) {
    ok('case details merged into document')
  } else {
    bad('case field merge failed')
    notes.push('doc text sample: ' + filled.slice(0, 400))
    notes.push('remaining tokens: ' + JSON.stringify(await page.locator('.doc-token').allInnerTexts()))
  }

  // प्रिंट पूर्वावलोकन + PDF
  await page.getByRole('button', { name: 'दृश्य', exact: true }).click()
  await page.locator('button[title="प्रिंट पूर्वावलोकन"]').first().click()
  await page.waitForSelector('.preview-page', { timeout: 90000 })
  await page.waitForTimeout(900)
  const pgCount = await page.locator('.preview-page').count()
  ok(`preview rendered ${pgCount} page(s)`)
  await shot(page, '09-preview-tablet')

  const previewRatio = await page.evaluate(() => {
    const el = document.querySelector('.preview-page')
    if (!el) return 0
    const r = el.getBoundingClientRect()
    return r.width / r.height
  })
  if (Math.abs(previewRatio - 8.5 / 14) < 0.02) ok('preview page is legal size ratio')
  else bad('preview ratio wrong: ' + previewRatio.toFixed(3))

  try {
    const [dl] = await Promise.all([
      page.waitForEvent('download', { timeout: 120000 }),
      page.getByRole('button', { name: /PDF साझा करें/ }).click(),
    ])
    const p = path.join(OUT, 'sample-export.pdf')
    await dl.saveAs(p)
    const size = fs.statSync(p).size
    const head = fs.readFileSync(p, { encoding: 'latin1', flag: 'r' }).slice(0, 5)
    if (size > 8000 && head.startsWith('%PDF')) ok(`PDF export works (${Math.round(size / 1024)} KB)`)
    else bad('PDF export invalid, size=' + size)
  } catch (e) {
    bad('PDF export failed: ' + e.message)
  }

  await page.locator('.sheet-head button[title="बंद करें"]').click()
  await page.waitForTimeout(400)

  // DOCX निर्यात
  await page.locator('button[title="निर्यात"]').first().click()
  await page.waitForTimeout(500)
  await shot(page, '10-export-sheet')
  try {
    const [dl] = await Promise.all([
      page.waitForEvent('download', { timeout: 90000 }),
      page.getByText('Word (DOCX)').click(),
    ])
    const p = path.join(OUT, 'sample-export.docx')
    await dl.saveAs(p)
    const size = fs.statSync(p).size
    if (size > 4000) ok(`DOCX export works (${Math.round(size / 1024)} KB)`)
    else bad('DOCX too small: ' + size)
  } catch (e) {
    bad('DOCX export failed: ' + e.message)
  }
  await page.waitForTimeout(600)
  for (let i = 0; i < 3 && (await page.locator('.backdrop').count()) > 0; i++) {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  }

  // लाइब्रेरी में लौटें + प्रारूप लाइब्रेरी
  for (let i = 0; i < 3 && (await page.locator('.backdrop').count()) > 0; i++) {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(250)
  }
  await page.locator('button[title="लाइब्रेरी"]').click()
  await page.waitForTimeout(600)
  await shot(page, '11-library-with-doc')

  await page.getByRole('button', { name: 'प्रारूप से बनाएँ' }).click()
  await page.waitForSelector('.sheet .tpl-card')
  await page.waitForTimeout(400)
  const tplCount = await page.locator('.sheet .tpl-card').count()
  if (tplCount > 20) ok(`template gallery has ${tplCount} templates`)
  else bad('few templates: ' + tplCount)
  await shot(page, '12-templates')
  await page.locator('.sheet .tpl-card').first().click()
  await page.waitForTimeout(400)
  await shot(page, '13-template-detail')
  await page.getByRole('button', { name: 'नया दस्तावेज़ बनाएँ' }).click()
  await page.waitForSelector('.paper .ProseMirror')
  await page.waitForTimeout(1000)
  await shot(page, '14-template-doc')
  const tplText = await page.locator('.paper').innerText()
  if (tplText.includes('न्यायालय')) ok('template body loaded into editor')
  else bad('template body missing')

  // धारा मैपिंग
  await page.locator('.topbar button[title="अधिक"]').click()
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: 'धारा मैपिंग' }).click()
  await page.waitForTimeout(600)
  await shot(page, '15-law-map')
  await page.locator('.sheet .search').fill('302')
  await page.waitForTimeout(400)
  const lawRows = await page.locator('.sheet .check-item').count()
  if (lawRows > 0) ok(`section mapping works (${lawRows} rows for 302)`)
  else bad('section mapping empty')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)

  // रीलोड पर स्थायीकरण
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  const docsAfterReload = await page.locator('.doc-card:not(.quick)').count()
  if (docsAfterReload >= 2) ok(`persistence works (${docsAfterReload} docs after reload)`)
  else bad('docs not persisted: ' + docsAfterReload)
  await shot(page, '16-library-after-reload')

  /* ===================== 2. फ़ोन — पोर्ट्रेट ===================== */
  const phone = await newPage(412, 915, 'phone')
  await shot(phone, '20-phone-library')
  await phone.locator('.doc-card.quick').click()
  await phone.waitForSelector('.paper .ProseMirror')
  await phone.waitForTimeout(1200)
  await shot(phone, '21-phone-editor')

  const overflow = await phone.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  if (overflow <= 1) ok('no horizontal overflow on phone')
  else bad('horizontal overflow on phone: ' + overflow)

  // फ़ोन पर रिबन स्क्रॉल
  await phone.getByRole('button', { name: 'होम', exact: true }).click()
  await phone.waitForTimeout(300)
  await shot(phone, '22-phone-ribbon')

  /* ==================== 3. टैबलेट — लैंडस्केप =================== */
  const land = await newPage(1280, 800, 'landscape')
  await land.locator('.doc-card.quick').click()
  await land.waitForSelector('.paper .ProseMirror')
  await land.waitForTimeout(1000)
  await shot(land, '30-landscape-editor')

  // अभिमुखता — पृष्ठ भूमि में
  await land.getByRole('button', { name: 'लेआउट', exact: true }).click()
  await land.locator('button[title="भूमि"]').click()
  await land.waitForTimeout(900)
  await shot(land, '31-landscape-page')
  const landRatio = await land.evaluate(() => {
    const p = document.querySelector('.paper')
    const r = p.getBoundingClientRect()
    return r.width / r.height
  })
  if (landRatio > 1.4) ok('landscape orientation applies to page')
  else bad('landscape page ratio wrong: ' + landRatio.toFixed(2))

  await land.close()
  await phone.close()
  await page.close()
} catch (e) {
  bad('FATAL: ' + e.message)
  console.error(e)
} finally {
  if (browser) await browser.close().catch(() => {})
  server.kill('SIGTERM')
}

console.log('\n--- notes ---')
notes.forEach((n) => console.log(n))
console.log('\n--- problems ---')
if (!problems.length) console.log('none')
problems.forEach((p) => console.log('✘ ' + p))
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ notes, problems }, null, 2))
process.exit(problems.length ? 1 : 0)

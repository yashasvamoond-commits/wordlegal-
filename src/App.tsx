import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Library } from './components/Library'
import { Editor } from './editor/Editor'
import { DictionaryPanel } from './components/DictionaryPanel'
import { PhraseSheet, TemplateGallery } from './components/Templates'
import { CasePanel, LawSheet } from './components/CasePanel'
import { AboutSheet, ExportSheet, PageSetup, SettingsSheet } from './components/PageSheets'
import { PreviewSheet } from './components/PreviewSheet'
import { CheckerSheet, FindReplaceSheet, VersionsSheet } from './components/ReviewSheets'
import { Toaster } from './components/ui'
import { toast } from './lib/toast'
import { fieldValues, fillTemplate, FALLBACKS } from './lib/fields'
import { templateById } from './data/templates'
import { courtHeading } from './data/courts'
import {
  createBlankDoc, createDocFromTemplate, DEFAULT_SETTINGS, loadDocs, loadSettings,
  saveDocs, saveSettings, uid, type Settings,
} from './lib/storage'
import type { CaseDetails, DocRecord, EditorApi, PageSettings, SheetKey, TemplateDef } from './types'

export default function App() {
  const [docs, setDocs] = useState<DocRecord[]>(() => loadDocs())
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [sheet, setSheet] = useState<SheetKey | null>(null)
  const [dictQuery, setDictQuery] = useState('')
  const api = useRef<EditorApi | null>(null)

  const doc = useMemo(() => docs.find((d) => d.id === currentId) ?? null, [docs, currentId])

  /* -------------------------- स्थायीकरण --------------------------- */
  useEffect(() => {
    const t = setTimeout(() => saveDocs(docs), 350)
    return () => clearTimeout(t)
  }, [docs])

  useEffect(() => {
    saveSettings(settings)
    document.documentElement.dataset.theme = settings.theme
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', settings.theme === 'dark' ? '#0b1220' : '#eef2f8')
  }, [settings])

  /* Android स्टेटस बार — थीम के अनुसार */
  useEffect(() => {
    ;(async () => {
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar')
        await StatusBar.setStyle({ style: settings.theme === 'dark' ? Style.Dark : Style.Light })
        await StatusBar.setBackgroundColor({ color: settings.theme === 'dark' ? '#0b1220' : '#eef2f8' })
      } catch { /* web */ }
    })()
  }, [settings.theme])

  /* Android बैक बटन — शीट बंद / लाइब्रेरी */
  useEffect(() => {
    let remove: (() => void) | undefined
    ;(async () => {
      try {
        const { App: CapApp } = await import('@capacitor/app')
        const h = await CapApp.addListener('backButton', () => {
          if (sheet) setSheet(null)
          else if (currentId) setCurrentId(null)
          else CapApp.exitApp()
        })
        remove = () => { h.remove() }
      } catch { /* web */ }
    })()
    return () => remove?.()
  }, [sheet, currentId])

  const patchDoc = useCallback((patch: Partial<DocRecord>) => {
    setDocs((ds) => ds.map((d) => (d.id === currentId ? { ...d, ...patch } : d)))
  }, [currentId])

  const updateCase = (patch: Partial<CaseDetails>) => {
    if (!doc) return
    const nextCd = { ...doc.caseDetails, ...patch }
    patchDoc({ caseDetails: nextCd, updatedAt: Date.now() })
    /* न्यायालय/स्थान बदलने पर केस-शीर्षक भी बदलें */
    if ((patch.court || patch.place || patch.customCourt !== undefined) && doc.caseDetails.court !== 'custom') {
      const before = courtHeading(doc.caseDetails, true)
      const after = courtHeading(nextCd, true)
      if (before && after && before !== after) window.setTimeout(() => api.current?.replaceAll(before, after), 60)
    }
  }

  const updatePage = (patch: Partial<PageSettings>) => {
    if (!doc) return
    patchDoc({ page: { ...doc.page, ...patch }, updatedAt: Date.now() })
  }

  /* ----------------------------- क्रियाएँ ------------------------- */
  const openDoc = (id: string) => { setCurrentId(id); setSheet(null); api.current = null }

  const newBlank = () => {
    const last = docs[0]
    const d = createBlankDoc(last?.caseDetails.court ?? 'jmfc', last?.caseDetails.place ?? '')
    if (last) d.caseDetails = { ...last.caseDetails }
    setDocs((ds) => [d, ...ds])
    setCurrentId(d.id)
    toast('नया लीगल साइज़ मसौदा बनाया गया', 'ok')
  }

  const fromTemplate = (tplId: string, cd?: CaseDetails) => {
    const tpl = templateById(tplId)
    if (!tpl) return
    const d = createDocFromTemplate(tpl, cd)
    setDocs((ds) => [d, ...ds])
    setCurrentId(d.id)
    toast('प्रारूप खोला गया — अब विवरण भरें', 'ok')
  }

  const pickTemplate = (tpl: TemplateDef, mode: 'new' | 'insert') => {
    if (mode === 'insert' && doc && api.current) {
      const html = fillTemplate(tpl.body, doc.caseDetails, doc.page)
      api.current.insertHtml(html)
      toast('प्रारूप मसौदे में जोड़ा गया', 'ok')
    } else {
      fromTemplate(tpl.id, doc?.caseDetails)
    }
  }

  const deleteDoc = (id: string) => {
    const d = docs.find((x) => x.id === id)
    if (!d) return
    if (!confirm(`“${d.title}” को स्थायी रूप से हटाएँ?`)) return
    setDocs((ds) => ds.filter((x) => x.id !== id))
    if (currentId === id) setCurrentId(null)
    toast('दस्तावेज़ हटाया गया', 'info')
  }

  const duplicateDoc = (id: string) => {
    const d = docs.find((x) => x.id === id)
    if (!d) return
    const copy: DocRecord = {
      ...d,
      id: uid(),
      title: `${d.title} — प्रतिलिपि`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      versions: [],
    }
    setDocs((ds) => [copy, ...ds])
    toast('प्रतिलिपि बनाई गई', 'ok')
  }

  const toggleStar = (id: string) => {
    setDocs((ds) => ds.map((d) => (d.id === id ? { ...d, starred: !d.starred } : d)))
  }

  const fillFields = () => {
    if (!doc || !api.current) return
    const vals = fieldValues(doc.caseDetails, doc.page)
    let total = 0
    for (const [k, v] of Object.entries(vals)) {
      if (!v) continue
      total += api.current.replaceAll(`{{${k}}}`, v)
      const fb = FALLBACKS[k]
      if (fb && fb.length > 2 && fb !== v) total += api.current.replaceAll(fb, v)
    }
    toast(total ? `${total} फ़ील्ड भरे गए` : 'भरने हेतु कोई फ़ील्ड नहीं मिला', total ? 'ok' : 'info')
  }

  const snapshot = () => {
    if (!doc || !api.current) return
    const html = api.current.getHTML()
    const versions = [
      ...(doc.versions ?? []),
      { at: Date.now(), html, label: `स्नैपशॉट ${(doc.versions?.length ?? 0) + 1}` },
    ].slice(-20)
    patchDoc({ versions })
  }

  const restore = (html: string) => {
    if (!api.current) return
    api.current.setHTML(html)
    patchDoc({ html, updatedAt: Date.now() })
  }

  const clearAll = () => {
    setDocs([])
    setCurrentId(null)
    setSettings(DEFAULT_SETTINGS)
    localStorage.clear()
    setSheet(null)
    toast('सारा डेटा मिटा दिया गया', 'info')
  }

  const closeSheet = () => setSheet(null)
  const typecss = useMemo(
    () => ({ fontFamily: settings.docFont, fontSize: settings.docSize, lineHeight: settings.docLh }),
    [settings.docFont, settings.docSize, settings.docLh],
  )

  /** निर्यात/पूर्वावलोकन हेतु — {{फ़ील्ड}} स्वतः भरे हुए */
  const htmlForSheets = () => {
    if (!doc) return ''
    const raw = api.current ? api.current.getHTML() : doc.html
    return settings.autoFill ? fillTemplate(raw, doc.caseDetails, doc.page) : raw
  }

  return (
    <>
      {doc ? (
        <Editor
          key={doc.id}
          doc={doc}
          settings={settings}
          onSettings={(s) => setSettings((x) => ({ ...x, ...s }))}
          onChange={patchDoc}
          onBack={() => setCurrentId(null)}
          onSheet={(s) => setSheet(s)}
          onApi={(a) => { api.current = a }}
          onFillFields={fillFields}
        />
      ) : (
        <Library
          docs={docs}
          onOpen={openDoc}
          onNew={newBlank}
          onFromTemplate={(id) => fromTemplate(id)}
          onOpenTemplates={() => setSheet('templates')}
          onOpenDict={() => { setDictQuery(''); setSheet('dict') }}
          onOpenLaw={() => setSheet('law')}
          onOpenSettings={() => setSheet('settings')}
          onOpenAbout={() => setSheet('about')}
          onDelete={deleteDoc}
          onDuplicate={duplicateDoc}
          onStar={toggleStar}
        />
      )}

      <DictionaryPanel
        open={sheet === 'dict'}
        onClose={closeSheet}
        initialQuery={dictQuery}
        onInsert={doc && api.current ? (t) => {
          api.current?.insertText(t)
          toast('शब्द मसौदे में जोड़ा गया', 'ok', 1500)
        } : undefined}
      />

      <TemplateGallery
        open={sheet === 'templates'}
        onClose={closeSheet}
        onPick={pickTemplate}
        allowInsert={!!doc}
        court={doc?.caseDetails.court}
      />

      <PhraseSheet
        open={sheet === 'phrases'}
        onClose={closeSheet}
        onInsert={api.current ? (h) => api.current?.insertHtml(h) : undefined}
      />

      {doc && (
        <>
          <CasePanel
            open={sheet === 'case'}
            onClose={closeSheet}
            cd={doc.caseDetails}
            onChange={updateCase}
            onFill={fillFields}
            docHtml={doc.html}
          />

          <PageSetup
            open={sheet === 'page'}
            onClose={closeSheet}
            page={doc.page}
            onChange={updatePage}
            settings={settings}
            onSettings={(s) => setSettings((x) => ({ ...x, ...s }))}
          />

          <ExportSheet
            open={sheet === 'export'}
            onClose={closeSheet}
            html={htmlForSheets()}
            page={doc.page}
            css={typecss}
            title={doc.title}
          />

          <PreviewSheet
            open={sheet === 'preview'}
            onClose={closeSheet}
            html={htmlForSheets()}
            page={doc.page}
            css={typecss}
            title={doc.title}
            onExportClick={() => setSheet('export')}
          />

          <FindReplaceSheet
            open={sheet === 'find'}
            onClose={closeSheet}
            getText={() => api.current?.getText() ?? ''}
            replaceAll={(a, b, cs) => api.current?.replaceAll(a, b, cs) ?? 0}
          />

          <CheckerSheet
            open={sheet === 'check'}
            onClose={closeSheet}
            getText={() => api.current?.getText() ?? ''}
            replaceAll={(a, b, cs) => api.current?.replaceAll(a, b, cs) ?? 0}
          />

          <VersionsSheet
            open={sheet === 'versions'}
            onClose={closeSheet}
            doc={doc}
            onSnapshot={snapshot}
            onRestore={restore}
          />
        </>
      )}

      <LawSheet
        open={sheet === 'law'}
        onClose={closeSheet}
        onInsert={doc && api.current ? (t) => api.current?.insertText(t) : undefined}
      />

      <SettingsSheet
        open={sheet === 'settings'}
        onClose={closeSheet}
        settings={settings}
        onSettings={(s) => setSettings((x) => ({ ...x, ...s }))}
        onClearAll={clearAll}
      />

      <AboutSheet open={sheet === 'about'} onClose={closeSheet} />
      <Toaster />
    </>
  )
}

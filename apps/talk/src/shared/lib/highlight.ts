import { createHighlighter, bundledLanguages, type Highlighter } from 'shiki'

/** Тема кода совпадает по настроению с тёмной темой презентации. */
const THEME = 'github-dark'
const PRELOADED = ['ts', 'tsx', 'js', 'jsx', 'html', 'json', 'bash']

let highlighterPromise: Promise<Highlighter> | undefined

function getHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({ themes: [THEME], langs: PRELOADED })
  return highlighterPromise
}

function isBundledLang(lang: string): lang is keyof typeof bundledLanguages {
  return Object.prototype.hasOwnProperty.call(bundledLanguages, lang)
}

/**
 * Подсвечивает код и возвращает HTML (shiki экранирует исходник, теги в него не утекают).
 * Неизвестный язык → plain text, чтобы слайд не упал на сцене.
 */
export async function highlight(code: string, lang: string): Promise<string> {
  const highlighter = await getHighlighter()

  let effectiveLang = 'text'
  if (isBundledLang(lang)) {
    if (!highlighter.getLoadedLanguages().includes(lang)) {
      await highlighter.loadLanguage(lang)
    }
    effectiveLang = lang
  }

  return highlighter.codeToHtml(code, { lang: effectiveLang, theme: THEME })
}

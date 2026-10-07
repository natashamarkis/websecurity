'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { App, Button, Drawer, Image, Progress, Tooltip } from 'antd'
import { ArrowLeftOutlined, ArrowRightOutlined, ExpandOutlined, FileTextOutlined, UnorderedListOutlined } from '@ant-design/icons'
import type { Module } from '@ws/slides-schema'
import { NavigationController } from '@/features/slide-navigation/NavigationController'
import { nextRoute, prevRoute, type DeckOutline } from '@/features/slide-navigation/navigation'

interface SlideDeckProps {
  module: Module
  index: number
  outline: DeckOutline
  notes?: string
  children: ReactNode
}

export function SlideDeck({ module, index, outline, notes, children }: SlideDeckProps) {
  const router = useRouter()
  const [contentsOpen, setContentsOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const { message } = App.useApp()
  const moduleIndex = outline.findIndex((item) => item.id === module.id)
  const position = outline.slice(0, moduleIndex).reduce((sum, item) => sum + item.slideCount, 0) + index + 1
  const total = outline.reduce((sum, item) => sum + item.slideCount, 0)
  const previous = prevRoute(outline, module.id, index)
  const next = nextRoute(outline, module.id, index)
  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen()
      else message.info('Полноэкранный режим недоступен в этом браузере')
    } catch {
      message.info('Не удалось открыть полноэкранный режим')
    }
  }

  return (
    <div className="talk-shell">
      <NavigationController outline={outline} moduleId={module.id} index={index} enabled={!contentsOpen && !notesOpen} />
      <header className="talk-header">
        <Link href="/talk/intro/0" className="brand-link" aria-label="На первый слайд">
          <Image src="/presentation/etm-logo.png" alt="ЭТМ" width={104} height={40} preview={false} />
        </Link>
        <span className="talk-header-title">Кибербезопасность</span>
        <div className="header-actions">
          <Tooltip title="Содержание"><Button aria-label="Содержание" icon={<UnorderedListOutlined />} onClick={() => setContentsOpen(true)} /></Tooltip>
          <Tooltip title="Заметки докладчика"><Button aria-label="Заметки докладчика" icon={<FileTextOutlined />} disabled={!notes} onClick={() => setNotesOpen(true)} /></Tooltip>
          <Tooltip title="Полный экран"><Button aria-label="Полный экран" icon={<ExpandOutlined />} onClick={fullscreen} /></Tooltip>
        </div>
      </header>
      <main className="slide-content" key={module.id + index}>{children}</main>
      <footer className="talk-footer">
        <span className="chapter-label">{module.title}</span>
        <div className="slide-controls">
          <Tooltip title="Предыдущий слайд"><Button aria-label="Предыдущий слайд" icon={<ArrowLeftOutlined />} onClick={() => previous && router.push(previous)} disabled={!previous} /></Tooltip>
          <span className="slide-counter" aria-live="polite">{String(position).padStart(2, '0')} <span>/ {total}</span></span>
          <Tooltip title="Следующий слайд"><Button aria-label="Следующий слайд" type="primary" icon={<ArrowRightOutlined />} onClick={() => next && router.push(next)} disabled={!next} /></Tooltip>
        </div>
      </footer>
      <Progress className="deck-progress" percent={position / total * 100} showInfo={false} strokeColor="#05358c" railColor="#e8edf5" strokeLinecap="butt" size={3} />
      <Drawer title="Содержание" open={contentsOpen} onClose={() => setContentsOpen(false)} size={380}>
        <nav className="contents-list" aria-label="Темы доклада">
          {outline.map((item) => (
            <Link key={item.id} href={`/talk/${item.id}/0`} aria-current={item.id === module.id ? 'page' : undefined} onClick={() => setContentsOpen(false)}>
              <span>{item.title ?? item.id}</span><ArrowRightOutlined />
            </Link>
          ))}
        </nav>
      </Drawer>
      <Drawer title="Заметки докладчика" placement="bottom" open={notesOpen} onClose={() => setNotesOpen(false)}>
        <p className="speaker-notes">{notes}</p>
      </Drawer>
    </div>
  )
}

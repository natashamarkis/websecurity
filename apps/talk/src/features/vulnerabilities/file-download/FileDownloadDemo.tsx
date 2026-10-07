'use client'

import { useState } from 'react'
import { Button, Input, Radio, Tabs } from 'antd'
import { DownloadOutlined, FileSearchOutlined } from '@ant-design/icons'
import type { DemoMode } from '@/shared/lib/demoMode'
import { BackendLayout, ServerResult, useBackendDemo, type Reply } from '@/features/backend-lab/client'

interface Result extends Reply { content?: string; filename?: string }
export function FileDownloadDemo({ mode }: { mode: DemoMode }) {
  const [scenario, setScenario] = useState('document')
  const [documentId, setDocumentId] = useState('1001')
  const [filename, setFilename] = useState('manual.txt')
  const demo = useBackendDemo<Result>('file-download', mode)
  const download = () => {
    if (!demo.result?.content) return
    const url = URL.createObjectURL(new Blob([demo.result.content], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = demo.result.filename ?? 'document.txt'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <BackendLayout title="Документы магазина" mode={mode} busy={demo.busy}>
    <Tabs activeKey={scenario} onChange={(key) => { setScenario(key); void demo.call({ action: 'reset' }) }} items={[
      { key: 'document', label: 'IDOR · чужой документ', disabled: demo.busy },
      { key: 'path', label: 'Path Traversal · путь к файлу', disabled: demo.busy },
    ]} />
    <div className="backend-columns">
      <section><h3>{scenario === 'document' ? 'Счета покупателя · Алекс' : 'Публичные инструкции'}</h3>
        {scenario === 'document' ? <>
          <Radio.Group className="backend-options" disabled={demo.busy} value={documentId} onChange={(event) => setDocumentId(event.target.value)} options={[
            { label: '1001 · мой счёт', value: '1001' }, { label: '1002 · счёт Марии', value: '1002' },
          ]} />
          <form onSubmit={(event) => { event.preventDefault(); void demo.call({ action: 'document', documentId }) }}>
            <label htmlFor="document-id">ID документа</label><Input id="document-id" value={documentId} maxLength={100} disabled={demo.busy} onChange={(event) => setDocumentId(event.target.value)} />
            <Button type="primary" htmlType="submit" icon={<FileSearchOutlined />} loading={demo.busy}>Запросить документ</Button>
          </form>
        </> : <>
          <Radio.Group className="backend-options" disabled={demo.busy} value={filename} onChange={(event) => setFilename(event.target.value)} options={[
            { label: 'Инструкция из downloads', value: 'manual.txt' }, { label: 'Внутренний файл вне downloads', value: '../internal.txt' },
          ]} />
          <form onSubmit={(event) => { event.preventDefault(); void demo.call({ action: 'path', filename }) }}>
            <label htmlFor="download-path">Имя файла</label><Input id="download-path" value={filename} maxLength={200} disabled={demo.busy} onChange={(event) => setFilename(event.target.value)} />
            <Button type="primary" htmlType="submit" icon={<FileSearchOutlined />} loading={demo.busy}>Запросить файл</Button>
          </form>
          <pre>{'server/\n  downloads/\n    manual.txt\n  internal.txt'}</pre>
        </>}
      </section>
      <ServerResult {...demo}>
        {demo.result?.content && <><pre data-testid="file-content">{demo.result.content}</pre><Button icon={<DownloadOutlined />} onClick={download}>Скачать полученный файл</Button></>}
      </ServerResult>
    </div>
  </BackendLayout>
}

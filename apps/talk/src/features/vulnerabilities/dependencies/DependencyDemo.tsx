'use client'

import { useEffect, useState } from 'react'
import { BugOutlined, SaveOutlined } from '@ant-design/icons'
import { Button, Input, Tag, Tooltip, Typography } from 'antd'
import type { DemoMode } from '@/shared/lib/demoMode'
import vulnerablePackage from './manifests/vulnerable.package.json'
import fixedPackage from './manifests/fixed.package.json'
import { DEFAULT_DESCRIPTION, DEPENDENCY_PAYLOAD } from './fixtures'
import { ProductPreview } from './ProductPreview'

export function DependencyDemo({ mode }: { mode: DemoMode }) {
  const [draft, setDraft] = useState(DEFAULT_DESCRIPTION)
  const [description, setDescription] = useState(DEFAULT_DESCRIPTION)
  const [revision, setRevision] = useState(0)
  const vulnerable = mode === 'vulnerable'
  const manifest = vulnerable ? vulnerablePackage : fixedPackage

  useEffect(() => {
    const reset = () => {
      setDraft(DEFAULT_DESCRIPTION)
      setDescription(DEFAULT_DESCRIPTION)
      setRevision((value) => value + 1)
    }
    window.addEventListener('demo:reset', reset)
    return () => window.removeEventListener('demo:reset', reset)
  }, [])

  return <div className="dependency-layout">
    <section className="dependency-editor" aria-label="Описание из каталога">
      <Typography.Title level={3}>Описание из каталога</Typography.Title>
      <form onSubmit={(event) => {
        event.preventDefault()
        setDescription(draft)
        setRevision((value) => value + 1)
      }}>
        <label htmlFor="product-description">Описание товара</label>
        <Input.TextArea id="product-description" value={draft} onChange={(event) => setDraft(event.target.value)} rows={7} maxLength={2000} />
        <div className="dependency-editor-actions">
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>Применить описание</Button>
          <Tooltip title="Подставить payload"><Button aria-label="Подставить payload" icon={<BugOutlined />} onClick={() => setDraft(DEPENDENCY_PAYLOAD)} /></Tooltip>
        </div>
      </form>
      <div className="dependency-package">
        <Tag>Учебная библиотека</Tag>
        <Typography.Text code data-testid="dependency-version">demo-description@{manifest.dependencies['demo-description']}</Typography.Text>
      </div>
      <pre className="dependency-consumer"><code>{'<ProductDescription text={product.description} />'}</code></pre>
    </section>
    <section className="dependency-product" aria-label="Карточка товара">
      <img src="/presentation/catalog.png" alt="Каталог электротехнической продукции" width={420} height={227} />
      <Typography.Title level={3}>Электротехническая продукция</Typography.Title>
      <Tag color="green">В наличии</Tag>
      <div className="dependency-description" data-testid="product-preview" key={`${mode}-${revision}`}>
        <ProductPreview text={description} vulnerable={vulnerable} />
      </div>
    </section>
  </div>
}

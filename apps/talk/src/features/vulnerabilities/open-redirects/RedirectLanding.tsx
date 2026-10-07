'use client'

import { useEffect, useState } from 'react'
import { Alert, Button, Spin, Typography } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import type { DemoMode } from '@/shared/lib/demoMode'
import { getRedirectTarget } from './get-redirect-target'
import { fixedGetRedirectTarget } from './fixed-get-redirect-target'
import { isDemoDestination } from './destinations'

export function RedirectLanding({ next, mode, attackerPort }: { next: string | null; mode: DemoMode; attackerPort: number }) {
  const [reason, setReason] = useState('')
  useEffect(() => {
    setReason('')
    if (!next) { setReason('В ссылке отсутствует адрес назначения.'); return }
    const origin = window.location.origin
    const target = mode === 'vulnerable'
      ? getRedirectTarget(next, origin)
      : fixedGetRedirectTarget(next, origin)
    if (!target) { setReason('Внешний или некорректный адрес назначения.'); return }
    if (!isDemoDestination(target, origin, attackerPort)) {
      setReason('В учебном стенде доступны только две подготовленные страницы. Внешние реальные сайты не открываются.')
      return
    }
    window.location.assign(target)
  }, [next, mode, attackerPort])

  return <section className="redirect-result">
    <Typography.Title level={3}>{reason ? 'Переход заблокирован' : 'Открываем заказ'}</Typography.Title>
    {reason ? <Alert type="warning" showIcon title={reason} /> : <Spin aria-label="Переход" />}
    <dl className="redirect-origins"><dt>Запрошенный адрес</dt><dd data-testid="requested-target">{next || 'Не указан'}</dd></dl>
    <Button href="/site/redirect" icon={<ArrowLeftOutlined />}>Вернуться к письму</Button>
  </section>
}

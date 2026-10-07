'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Segmented } from 'antd'
import type { DemoMode } from '@/shared/lib/demoMode'

interface DemoModeToggleProps {
  mode: DemoMode
  reloadOnChange?: boolean
}

export async function setDemoMode(mode: DemoMode): Promise<void> {
  await fetch('/api/demo-mode', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ mode }),
  })
}

/** Тумблер «Уязвимо / Исправлено»: ставит cookie и перерисовывает серверные компоненты. */
export function DemoModeToggle({ mode, reloadOnChange = false }: DemoModeToggleProps) {
  const router = useRouter()
  const [value, setValue] = useState<DemoMode>(mode)
  const [pending, startTransition] = useTransition()
  const [ready, setReady] = useState(false)
  useEffect(() => { setReady(true) }, [])

  const onChange = (next: DemoMode) => {
    setValue(next)
    startTransition(async () => {
      await setDemoMode(next)
      // Новый документ не наследует уже выполненные сторонние скрипты.
      if (reloadOnChange) window.location.reload()
      else router.refresh()
    })
  }

  return (
    <Segmented<DemoMode>
      value={value}
      disabled={pending || !ready}
      onChange={onChange}
      options={[
        { label: 'Уязвимо', value: 'vulnerable' },
        { label: 'Исправлено', value: 'fixed' },
      ]}
    />
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Segmented } from 'antd'
import type { DemoMode } from '@/shared/lib/demoMode'

interface DemoModeToggleProps {
  mode: DemoMode
}

export async function setDemoMode(mode: DemoMode): Promise<void> {
  await fetch('/api/demo-mode', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ mode }),
  })
}

/** Тумблер «Уязвимо / Исправлено»: ставит cookie и перерисовывает серверные компоненты. */
export function DemoModeToggle({ mode }: DemoModeToggleProps) {
  const router = useRouter()
  const [value, setValue] = useState<DemoMode>(mode)
  const [pending, startTransition] = useTransition()

  const onChange = (next: DemoMode) => {
    setValue(next)
    startTransition(async () => {
      await setDemoMode(next)
      router.refresh()
    })
  }

  return (
    <Segmented<DemoMode>
      value={value}
      disabled={pending}
      onChange={onChange}
      options={[
        { label: 'Уязвимо', value: 'vulnerable' },
        { label: 'Исправлено', value: 'fixed' },
      ]}
    />
  )
}

'use client'

import { Alert } from 'antd'

/** Фолбэк: схема не должна такое пропускать, но лучше показать, чем упасть на сцене. */
export function UnknownSlide({ type }: { type: string }) {
  return (
    <Alert
      type="warning"
      showIcon
      message={`Неизвестный тип слайда: ${type}`}
      description="Проверь content/slides и запусти pnpm validate:slides."
    />
  )
}

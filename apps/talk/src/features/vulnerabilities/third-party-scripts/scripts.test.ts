import { describe, expect, it } from 'vitest'
import { createSupportChatScript } from './create-support-chat-script'
import { fixedCreateSupportChatScript } from './fixed-create-support-chat-script'

describe('support chat integration', () => {
  const src = 'http://127.0.0.1:3001/third-party/support-chat.js?variant=compromised'
  it('loads the supplier script in vulnerable mode', () => {
    const script = createSupportChatScript(src)
    expect(script.src).toBe(src)
    expect(script.crossOrigin).toBe('anonymous')
  })
  it('does not even create a script on checkout in fixed mode', () => {
    expect(fixedCreateSupportChatScript(src, '/site/checkout')).toBeNull()
  })
  it('preserves chat integration on other pages', () => {
    expect(fixedCreateSupportChatScript(src, '/site')?.src).toBe(src)
  })
})

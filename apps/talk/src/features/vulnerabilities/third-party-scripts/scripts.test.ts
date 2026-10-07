import { describe, expect, it } from 'vitest'
import { createSupportChatScript } from './create-support-chat-script'
import { fixedCreateSupportChatScript } from './fixed-create-support-chat-script'
import { TRUSTED_CHAT_INTEGRITY } from './integrity'

describe('support chat integration', () => {
  const src = 'http://127.0.0.1:3001/third-party/support-chat.js?variant=compromised'
  it('loads the supplier script in vulnerable mode', () => {
    const script = createSupportChatScript(src)
    expect(script.src).toBe(src)
    expect(script.crossOrigin).toBe('anonymous')
  })
  it.each(['/site', '/site/checkout'])('pins the trusted bytes before insertion on %s', (pathname) => {
    window.history.replaceState(null, '', pathname)
    const script = fixedCreateSupportChatScript(src)
    expect(script.src).toBe(src)
    expect(script.crossOrigin).toBe('anonymous')
    expect(script.integrity).toBe(TRUSTED_CHAT_INTEGRITY)
    expect(script.isConnected).toBe(false)
  })
  it('leaves the vulnerable script without integrity', () => {
    expect(createSupportChatScript(src).hasAttribute('integrity')).toBe(false)
  })
})

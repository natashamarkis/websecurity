import { Flex } from 'antd'
import { SlideTitle } from '@/shared/ui/atoms/SlideTitle'
import { Lead } from '@/shared/ui/atoms/Lead'

export default function TalkCoverPage() {
  return (
    <Flex
      vertical
      justify="center"
      align="center"
      style={{ minHeight: '100vh', padding: 48 }}
    >
      <SlideTitle align="center">Web Security Tech Talk</SlideTitle>
      <Lead align="center" maxWidth={640}>
        Учимся находить и предотвращать frontend-уязвимости: демонстрация в
        контролируемой среде и разбор защиты.
      </Lead>
    </Flex>
  )
}

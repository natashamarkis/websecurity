import { Flex } from 'antd'
import { demoUser } from '@/entities/demo-user/model'
import { SiteHeader } from '@/widgets/site-header/SiteHeader'
import { SlideTitle } from '@/shared/ui/atoms/SlideTitle'
import { CommentsBoard } from '@/features/vuln-xss/CommentsBoard'

export const dynamic = 'force-dynamic'

/** Страница комментариев — площадка для stored XSS. */
export default function CommentsPage() {
  return (
    <>
      <SiteHeader userName={demoUser.name} current="comments" />
      <Flex vertical gap={16} style={{ padding: 32 }}>
        <SlideTitle level={3}>Комментарии</SlideTitle>
        <CommentsBoard />
      </Flex>
    </>
  )
}

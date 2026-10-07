'use client'

import Link from 'next/link'
import { Row, Col, Card, Flex, Typography } from 'antd'
import { BadgeTag } from '@/shared/ui/atoms/BadgeTag'

export interface ModuleCardData {
  id: string
  title: string
  slideCount: number
  meta?: { cwe?: string; cvss?: string; owasp?: string }
}

interface ModuleGridProps {
  modules: ModuleCardData[]
}

/** Сетка модулей на обложке. Клик ведёт на первый слайд модуля. */
export function ModuleGrid({ modules }: ModuleGridProps) {
  return (
    <Row gutter={[24, 24]} style={{ width: '100%', maxWidth: 1200 }}>
      {modules.map((m, i) => (
        <Col key={m.id} xs={24} sm={12} lg={8}>
          <Link href={`/talk/${m.id}/0`} style={{ display: 'block', height: '100%' }}>
            <Card hoverable title={`${i}. ${m.title}`} style={{ height: '100%' }}>
              <Flex vertical gap={8}>
                <Flex gap={4} wrap>
                  {m.meta?.cwe && <BadgeTag color="volcano">{m.meta.cwe}</BadgeTag>}
                  {m.meta?.owasp && <BadgeTag color="geekblue">{m.meta.owasp}</BadgeTag>}
                  {m.meta?.cvss && <BadgeTag color="gold">CVSS {m.meta.cvss}</BadgeTag>}
                </Flex>
                <Typography.Text type="secondary">{m.slideCount} слайдов</Typography.Text>
              </Flex>
            </Card>
          </Link>
        </Col>
      ))}
    </Row>
  )
}

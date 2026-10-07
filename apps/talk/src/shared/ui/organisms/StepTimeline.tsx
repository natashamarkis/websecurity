'use client'

import { Timeline, Typography } from 'antd'

export interface TimelineStep {
  title: string
  text: string
}

interface StepTimelineProps {
  steps: TimelineStep[]
}

/** Обёртка над Timeline для хронологии атаки. */
export function StepTimeline({ steps }: StepTimelineProps) {
  return (
    <Timeline
      className="talk-timeline"
      items={steps.map((step, index) => ({
        icon: <span className="timeline-number">{index + 1}</span>,
        content: (
          <>
            <Typography.Text strong style={{ fontSize: 22 }}>
              {step.title}
            </Typography.Text>
            <Typography.Paragraph style={{ fontSize: 18, marginBottom: 0 }}>
              {step.text}
            </Typography.Paragraph>
          </>
        ),
      }))}
    />
  )
}

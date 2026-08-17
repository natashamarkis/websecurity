'use client';

import { CopyOutlined } from '@ant-design/icons';
import { App, Button } from 'antd';

export function PayloadCopy({ code }: { code: string }) {
  const { message } = App.useApp();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: '#0d1117',
        color: '#e6edf3',
        borderRadius: 8,
        padding: '8px 12px',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 13,
      }}
    >
      <code
        style={{ flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
      >
        {code}
      </code>
      <Button
        size="small"
        icon={<CopyOutlined />}
        onClick={async () => {
          await navigator.clipboard.writeText(code);
          message.success('Скопировано');
        }}
      >
        Копировать
      </Button>
    </div>
  );
}

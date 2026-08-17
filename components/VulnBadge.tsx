import { BugOutlined } from '@ant-design/icons';
import { Alert } from 'antd';
import Link from 'next/link';

export function VulnBadge({
  title,
  wikiHref = '/',
}: {
  title: string;
  wikiHref?: string;
}) {
  return (
    <Alert
      type="warning"
      showIcon
      icon={<BugOutlined />}
      style={{ marginBottom: 16 }}
      message={
        <span>
          <b>Учебная уязвимость:</b> {title}
        </span>
      }
      action={<Link href={wikiHref}>В вики →</Link>}
    />
  );
}

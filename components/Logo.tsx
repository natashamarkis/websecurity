import Link from 'next/link';

import { ETM } from '@/lib/theme';

/** Локальный лого-плейсхолдер (не тянем cdn.etm.ru спрайт). */
export function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        textDecoration: 'none',
      }}
    >
      <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
        <rect width="30" height="30" rx="7" fill={ETM.primary} />
        <path
          d="M16.5 5 L8 17 h6 l-1.5 8 L21 12 h-6 z"
          fill="#fff"
        />
      </svg>
      <span style={{ fontSize: 18, fontWeight: 700, whiteSpace: 'nowrap' }}>
        <span style={{ color: ETM.selectedText }}>iPRO</span>{' '}
        <span style={{ color: ETM.primary }}>OneTeam</span>
      </span>
    </Link>
  );
}

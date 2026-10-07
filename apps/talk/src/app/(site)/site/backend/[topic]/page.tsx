import { notFound } from 'next/navigation'
import { getServerMode } from '@/shared/lib/demoMode.server'
import { SiteHeader } from '@/widgets/site-header/SiteHeader'
import { SsrfDemo } from '@/features/vulnerabilities/ssrf/SsrfDemo'
import { SessionsDemo } from '@/features/vulnerabilities/sessions/SessionsDemo'
import { SqlInjectionDemo } from '@/features/vulnerabilities/sql-injection/SqlInjectionDemo'
import { BruteForceDemo } from '@/features/vulnerabilities/brute-force/BruteForceDemo'
import { FileDownloadDemo } from '@/features/vulnerabilities/file-download/FileDownloadDemo'

const demos = { ssrf: SsrfDemo, sessions: SessionsDemo, 'sql-injection': SqlInjectionDemo, 'brute-force': BruteForceDemo, 'file-download': FileDownloadDemo }
export default async function BackendPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params
  if (!Object.hasOwn(demos, topic)) notFound()
  const Demo = demos[topic as keyof typeof demos]
  const mode = await getServerMode()
  return <><SiteHeader userName="Алекс" current="backend" /><div className="site-content"><Demo mode={mode} /></div></>
}

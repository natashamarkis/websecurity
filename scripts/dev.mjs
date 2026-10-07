import { spawn } from 'node:child_process'
import { fileURLToPath, URL } from 'node:url'
import process from 'node:process'
import console from 'node:console'

const root = new URL('../', import.meta.url)
const children = [
  spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '-H', '127.0.0.1', '-p', process.env.TALK_PORT ?? '3000'], {
    cwd: fileURLToPath(new URL('apps/talk/', root)), stdio: 'inherit',
  }),
  spawn(process.execPath, [fileURLToPath(new URL('scripts/csrf-attacker.mjs', root))], { stdio: 'inherit' }),
]
let stopping = false
function stop(code) {
  if (stopping) return
  stopping = true
  for (const child of children) child.kill()
  process.exitCode = code
}
for (const child of children) {
  child.on('error', (error) => { console.error(error); stop(1) })
  child.on('exit', (code) => stop(code ?? 0))
}
process.on('SIGINT', () => stop(0))
process.on('SIGTERM', () => stop(0))

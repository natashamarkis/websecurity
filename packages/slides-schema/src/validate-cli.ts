import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateModules, type ModuleInput } from './validate'

const here = path.dirname(fileURLToPath(import.meta.url))
// packages/slides-schema/src -> repo root
const repoRoot = path.resolve(here, '../../..')
const slidesDir = path.join(repoRoot, 'content', 'slides')
const indexPath = path.join(slidesDir, 'index.json')
/** Откуда слайды типа `code` берут файлы. Переопределяется через TALK_SRC_DIR. */
const talkSrcDir = path.resolve(process.env.TALK_SRC_DIR ?? path.join(repoRoot, 'apps', 'talk', 'src'))

async function main(): Promise<void> {
  if (!existsSync(indexPath)) {
    console.log(`no modules found (missing ${path.relative(repoRoot, indexPath)})`)
    return
  }

  const index = JSON.parse(await readFile(indexPath, 'utf8')) as { modules?: string[] }
  const files = index.modules ?? []

  if (files.length === 0) {
    console.log('no modules found (empty index)')
    return
  }

  const modules: ModuleInput[] = []
  for (const file of files) {
    const full = path.join(slidesDir, file)
    if (!existsSync(full)) {
      console.error(`missing module file referenced in index.json: ${file}`)
      process.exit(1)
    }
    modules.push({ file, data: JSON.parse(await readFile(full, 'utf8')) })
  }

  const result = validateModules(modules, {
    fileExists: (rel) => existsSync(path.join(talkSrcDir, rel)),
  })
  if (result.ok) {
    console.log(`ok: ${modules.length} module(s) valid`)
    return
  }

  console.error('slide validation failed:')
  for (const err of result.errors) console.error(`  - ${err}`)
  process.exit(1)
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})

import fs from 'fs'
import path from 'path'
import { performance } from 'perf_hooks'

import { DbDrop } from '../../packages/migrate/src/commands/DbDrop'
import { DbPush } from '../../packages/migrate/src/commands/DbPush'
import { PrismaClient } from '.prisma/client'
import { QueryEngine } from '.prisma/client/libquery_engine-darwin-arm64.dylib.node'

const schemaPath = path.join(__dirname, 'prisma/schema.prisma')
const datamodel = fs.readFileSync(schemaPath, 'utf8')
const transactionOptions = JSON.stringify({ max_wait: 2000, timeout: 5000 })

async function main() {
  const qe = new QueryEngine(
    {
      datamodel,
      logLevel: 'error',
      configDir: '.',
    },
    () => {},
  )
  const pc = new PrismaClient()
  for (let i = 0; i < 50; i++) {
    await DbPush.new().parse(['--schema', schemaPath, '--force-reset', '--skip-generate'])
    const start = performance.now()
    // await pc.$transaction(async () => {})
    // await pc.$disconnect()
    await qe.connect()
    const response = JSON.parse(await qe.startTransaction(transactionOptions, '{}'))
    await qe.commitTransaction(response.id)
    await qe.disconnect()
    console.log(`engine time: ${performance.now() - start}`)
    await DbDrop.new().parse(['--schema', schemaPath, '--force', '--preview-feature'])
  }
}

void main().catch((e) => {
  console.log(e.message)
  process.exit(1)
})

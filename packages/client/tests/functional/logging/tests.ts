import { NewPrismaClient } from '../_utils/types'
import testMatrix from './_matrix'
// @ts-ignore
import type { Prisma, PrismaClient } from './node_modules/@prisma/client'

declare let newPrismaClient: NewPrismaClient<typeof PrismaClient>

testMatrix.setupTestSuite((_suiteConfig, _suiteMeta, clientMeta) => {
  let client: PrismaClient<Prisma.PrismaClientOptions, 'query'>

  test('should log queries', async () => {
    client = newPrismaClient({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
      ],
    })

    const queryLogPromise = new Promise<Prisma.QueryEvent>((resolve) => {
      client.$on('query', (data) => {
        if ('query' in data) {
          resolve(data)
        }
      })
    })

    await client.user.findMany()

    const queryLogEvents = await queryLogPromise
    expect(queryLogEvents).toHaveProperty('query')

    if (_suiteConfig.provider === 'mongodb') {
      expect(queryLogEvents.query).toContain('db.User.findMany')
    } else {
      expect(queryLogEvents.query).toContain('SELECT')
    }

    if (!clientMeta.dataProxy) {
      expect(queryLogEvents).toHaveProperty('timestamp')
      expect(queryLogEvents).toHaveProperty('params')
      expect(queryLogEvents).toHaveProperty('duration')
      expect(queryLogEvents).toHaveProperty('target')
      expect(queryLogEvents).toHaveProperty('query')
    }

    await client.$disconnect()
  })
})

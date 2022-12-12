// @ts-ignore
import { NewPrismaClient } from '../../_utils/types'
import testMatrix from './_matrix'
// @ts-ignore
import type { PrismaClient } from './node_modules/@prisma/client'

declare let newPrismaClient: NewPrismaClient<typeof PrismaClient>

testMatrix.setupTestSuite(() => {
  let client: PrismaClient

  test('should log queries', async () => {
    client = newPrismaClient({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'stdout',
          level: 'query',
        },
      ],
    })

    const queryLogPromise = ((): Promise<any> =>
      new Promise((resolve) => {
        // @ts-expect-error
        client.$on('query', (data) => {
          if ('query' in data) {
            resolve(data)
          }
        })
      }))()

    await client.user.findMany()

    const queryLogEvents = await queryLogPromise
    expect(queryLogEvents).toHaveProperty('timestamp')
    expect(queryLogEvents).toHaveProperty('query')
    expect(queryLogEvents).toHaveProperty('params')
    expect(queryLogEvents).toHaveProperty('duration')
    expect(queryLogEvents).toHaveProperty('target')
    expect(queryLogEvents).toHaveProperty('query')
  })
})

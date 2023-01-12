import { faker } from '@faker-js/faker'

import { NewPrismaClient } from '../_utils/types'
import testMatrix from './_matrix'
// @ts-ignore
import type { Prisma, PrismaClient } from './node_modules/@prisma/client'

declare let newPrismaClient: NewPrismaClient<typeof PrismaClient>

testMatrix.setupTestSuite((suiteConfig, _suiteMeta, clientMeta) => {
  let client: PrismaClient<Prisma.PrismaClientOptions, 'query'>

  test('should log queries on a method call', async () => {
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
    expect(queryLogEvents).toHaveProperty('duration')
    expect(queryLogEvents).toHaveProperty('timestamp')

    if (suiteConfig.provider === 'mongodb') {
      expect(queryLogEvents.query).toContain('db.User.aggregate')
    } else {
      expect(queryLogEvents.query).toContain('SELECT')
    }

    if (!clientMeta.dataProxy) {
      expect(queryLogEvents).toHaveProperty('params')
      expect(queryLogEvents).toHaveProperty('target')
    }

    await client.$disconnect()
  })

  test('should log queries inside a ITX', async () => {
    client = newPrismaClient({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
      ],
    })

    const queryLogs = new Promise<Prisma.QueryEvent[]>((resolve) => {
      const logs: Prisma.QueryEvent[] = []

      client.$on('query', (data) => {
        if ('query' in data) {
          logs.push(data)

          if (logs.length === 3) {
            resolve(logs)
          }
        }
      })
    })

    await client.$transaction(async (tx) => {
      const id = suiteConfig.provider === 'mongodb' ? faker.database.mongodbObjectId() : faker.random.numeric()

      await tx.user.create({
        data: {
          id,
        },
      })

      return tx.user.findMany({
        where: {
          id,
        },
      })
    })

    const logs = await queryLogs
    expect(logs).toHaveLength(3)

    if (suiteConfig.provider === 'mongodb') {
      expect(logs[0].query).toContain('User.insertOne')
      expect(logs[1].query).toContain('User.aggregate')
      expect(logs[2].query).toContain('User.aggregate')
    } else {
      expect(logs[0].query).toContain('INSERT')
      expect(logs[1].query).toContain('SELECT')
      expect(logs[2].query).toContain('SELECT')
    }
  })
})

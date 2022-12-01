import { faker } from '@faker-js/faker'

import testMatrix from './_matrix'
// @ts-ignore
import type { PrismaClient } from './node_modules/@prisma/client'

class NotFoundError extends Error {}
declare let prisma: PrismaClient
const missing = faker.random.alphaNumeric(11)

testMatrix.setupTestSuite((suiteConfig, suiteMeta, clientMeta) => {
  beforeEach(async () => {
    await prisma.user.deleteMany()
  })

  test('batched errors are serialized properly', async () => {
    const id = await prisma.user
      .create({
        data: {},
      })
      .then((u) => u.id)

    const id2 = await prisma.user
      .create({
        data: {},
      })
      .then((u) => u.id)

    const found = prisma.user.findUniqueOrThrow({ where: { id } })
    const foundToo = prisma.user.findUniqueOrThrow({ where: { id: id2 } })
    const result = await Promise.allSettled([found, foundToo])
    expect(result).toEqual([
      { status: 'fulfilled', value: { id } },
      { status: 'fulfilled', value: { id: id2 } },
    ])

    await prisma.user.delete({ where: { id: id2 } })

    const alsoFound = prisma.user.findUnique({ where: { id } })
    const notFound = prisma.user.findUniqueOrThrow({ where: { id: id2 } })
    const notFoundEither = prisma.user.findUniqueOrThrow({ where: { id: id2 } })
    const newResult = await Promise.allSettled([alsoFound, notFound, found, notFoundEither])

    console.log(newResult)
    expect(newResult).toEqual([
      { status: 'fulfilled', value: { id } },
      { reason: new NotFoundError('No User found'), status: 'rejected' },
      { status: 'fulfilled', value: { id } },
      { reason: new NotFoundError('No User found'), status: 'rejected' },
    ])
  })
}, {})

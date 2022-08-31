import { Prisma, newPrismaClient } from './_globals.generated'
import testMatrix from './_matrix'

testMatrix.setupTestSuite(
  () => {
    beforeAll(() => {
      const env = require('./prisma/env.json')
      Object.assign(process.env, env)
    })

    test('PrismaClientInitializationError for invalid env', async () => {
      const prisma = newPrismaClient()
      await expect(prisma.$connect()).rejects.toBeInstanceOf(Prisma.PrismaClientInitializationError)
    })
  },
  { skipDb: true, skipDefaultClientInstance: true }, // So we can maually call connect for this test
)

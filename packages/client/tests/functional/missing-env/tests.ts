import { newPrismaClient, Prisma } from './_globals.generated'

import testMatrix from './_matrix'

testMatrix.setupTestSuite(
  () => {
    test('PrismaClientInitializationError for missing env', async () => {
      const prisma = newPrismaClient()
      await expect(prisma.$connect()).rejects.toBeInstanceOf(Prisma.PrismaClientInitializationError)
    })
  },
  { skipDb: true, skipDefaultClientInstance: true }, // So we can manually call connect for this test
)

import testMatrix from './_matrix'

// @ts-ignore this is just for type checks
declare let prisma: import('@prisma/client').PrismaClient

testMatrix.setupTestSuite(
  (suiteConfig, suiteMeta) => {
    test('example', () => {
      expect(suiteConfig.provider + '!').toMatchSnapshot()
    })
  },
  {
    optOut: {
      from: ['mysql', 'cockroachdb', 'sqlserver'],
      reason: 'just because',
    },
  },
)

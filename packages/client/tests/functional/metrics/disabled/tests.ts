import { expectTypeOf } from 'expect-type'
import { prisma } from './_globals.generated'

import testMatrix from './_matrix'

testMatrix.setupTestSuite(() => {
  test('attempt to use $metrics a compile-time error', () => {
    expectTypeOf(prisma).not.toHaveProperty('$metrics')
  })

  test('attempt to use $metrics a run-time error', () => {
    expect(() => (prisma as any).$metrics).toThrowErrorMatchingInlineSnapshot(
      `\`metrics\` preview feature must be enabled in order to access metrics API`,
    )
  })
})

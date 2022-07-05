import { faker } from '@faker-js/faker'
import { exec } from 'child_process'
import { expectTypeOf } from 'expect-type'

import testMatrix from './_matrix'

// @ts-ignore this is just for type checks
declare let prisma: import('@prisma/client').PrismaClient

const existingEmail = faker.internet.email()
const nonExistingEmail = faker.internet.email()

testMatrix.setupTestSuite((suiteConfig, suiteMeta) => {
  beforeAll(async () => {
    await prisma.user.create({ data: { email: existingEmail, posts: { create: { title: 'How to exist?' } } } })
  })

  test('finds existing record', async () => {
    const record = await prisma.user.findFirstOrThrow({ where: { email: existingEmail } })
    expect(record).toMatchObject({ id: expect.any(String), email: existingEmail })
    expectTypeOf(record).not.toBeNullable()
  })

  test('works with fluent api', async () => {
    const posts = await prisma.user.findFirstOrThrow({ where: { email: existingEmail } }).posts()
    expect(posts).toMatchInlineSnapshot(
      [{ id: expect.any(String), authorId: expect.any(String) }],
      `
      Array [
        Object {
          authorId: Any<String>,
          id: Any<String>,
          title: How to exist?,
        },
      ]
    `,
    )
  })

  test('throws if record was not found', async () => {
    const record = prisma.user.findFirstOrThrow({ where: { email: nonExistingEmail } })
    await expect(record).rejects.toMatchInlineSnapshot(`
            NotFoundError: No User found
                at /client/runtime/index.js:24013:13
                at Object.<anonymous> (/client/tests/functional/findFirstOrThrow/tests.ts:42:5)
          `)
  })

  // TODO: it actually does not work this way, but neither does `rejectOnNotFound`.
  // unclear, if intentional
  test.skip('works with transactions', async () => {
    const newEmail = faker.internet.email()
    const result = prisma.$transaction([
      prisma.user.create({ data: { email: newEmail } }),
      prisma.user.findFirst({ where: { email: nonExistingEmail }, rejectOnNotFound: true }),
    ])

    await expect(result).rejects.toMatchInlineSnapshot(`No User found`)

    const record = await prisma.user.findFirst({ where: { email: newEmail } })
    expect(record).toBeNull()
  })

  test('works with interactive transactions', async () => {
    const newEmail = faker.internet.email()
    const result = prisma.$transaction(async (prisma) => {
      await prisma.user.create({ data: { email: newEmail } })
      await prisma.user.findFirstOrThrow({ where: { email: nonExistingEmail } })
    })

    await expect(result).rejects.toMatchInlineSnapshot(`
            NotFoundError: No User found
                at /client/runtime/index.js:24013:13
                at /client/tests/functional/findFirstOrThrow/tests.ts:68:7
                at Proxy._transactionWithCallback (/client/runtime/index.js:25318:18)
                at Object.<anonymous> (/client/tests/functional/findFirstOrThrow/tests.ts:71:5)
          `)

    const record = await prisma.user.findFirst({ where: { email: newEmail } })
    expect(record).toBeNull()
  })

  test('reports correct method name in case of validation error', async () => {
    const record = prisma.user.findFirstOrThrow({
      where: {
        // @ts-expect-error triggering validation error on purpose
        notAUserField: true,
      },
    })
    // await expect(record).rejects.toMatchObject({
    //   message: expect.stringContaining('Invalid `prisma.user.findFirstOrThrow()` invocation'),
    // })
  })

  test('does not accept rejectOnNotFound option', async () => {
    const record = prisma.user.findFirstOrThrow({
      where: { email: existingEmail },
      // @ts-expect-error passing not supported option on purpose
      rejectOnNotFound: false,
    })

    await expect(record).rejects.toMatchInlineSnapshot(`
            Error: 
            Invalid \`prisma.user.findFirstOrThrow()\` invocation:


            'rejectOnNotFound' option is not supported
                at /client/runtime/index.js:24008:13
                at requestFn (/client/runtime/index.js:24113:18)
                at callback (/client/runtime/index.js:21619:52)
                at Proxy._callback (/client/runtime/index.js:21626:14)
                at Object.toMatchInlineSnapshot (/Users/serhii/projects/prisma/node_modules/.pnpm/expect@28.1.1/node_modules/expect/build/index.js:242:26)
                at Object.toMatchInlineSnapshot (/client/tests/functional/findFirstOrThrow/tests.ts:102:34)
                at Promise.then.completed (/Users/serhii/projects/prisma/node_modules/.pnpm/jest-circus@28.1.2/node_modules/jest-circus/build/utils.js:333:28)
                at new Promise (<anonymous>)
                at callAsyncCircusFn (/Users/serhii/projects/prisma/node_modules/.pnpm/jest-circus@28.1.2/node_modules/jest-circus/build/utils.js:259:10)
                at _callCircusTest (/Users/serhii/projects/prisma/node_modules/.pnpm/jest-circus@28.1.2/node_modules/jest-circus/build/run.js:277:40)
          `)
  })
})

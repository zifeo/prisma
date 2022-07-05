import testMatrix from './_matrix'

// @ts-ignore
declare let prisma: import('@prisma/client').PrismaClient
// @ts-ignore
declare let Prisma: typeof import('@prisma/client').Prisma

testMatrix.setupTestSuite(
  () => {
    describe('nullableJsonField', () => {
      test('JsonNull', async () => {
        const data = await prisma.nullableJsonField.create({
          data: {
            json: Prisma.JsonNull,
          },
        })
        expect(data.json).toBe(null)
      })

      test('DbNull', async () => {
        const data = await prisma.nullableJsonField.create({
          data: {
            json: Prisma.DbNull,
          },
        })
        expect(data.json).toBe(null)
      })
    })

    describe('requiredJsonField', () => {
      test('JsonNull', async () => {
        const data = await prisma.requiredJsonField.create({
          data: {
            json: Prisma.JsonNull,
          },
        })
        expect(data.json).toBe(null)
      })

      test('DbNull', async () => {
        await expect(
          prisma.requiredJsonField.create({
            data: {
              // @ts-expect-error
              json: Prisma.DbNull,
            },
          }),
        ).rejects.toMatchInlineSnapshot(`
                Error: Argument json: Provided value Prisma.DbNull of type DbNull on prisma.createOneRequiredJsonField is not a JsonNullValueInput.
                → Possible values: JsonNullValueInput.JsonNull

                    at Document.validate (/client/runtime/index.js:22979:20)
                    at PrismaClient.validate [as _executeRequest] (/client/runtime/index.js:25417:17)
                    at _executeRequest (/client/runtime/index.js:25354:23)
                    at consumer (/client/runtime/index.js:25358:76)
                    at cb (/client/runtime/index.js:24563:12)
                    at runInChildSpan (/client/runtime/index.js:25358:20)
                    at AsyncResource.runInAsyncScope (node:async_hooks:202:9)
                    at PrismaClient.runInAsyncScope [as _request] (/client/runtime/index.js:25357:86)
                    at _request (/client/runtime/index.js:24100:65)
                    at requestFn (/client/runtime/index.js:24113:18)
              `)
      })
    })

    describe('properties of DbNull/JsonNull/AnyNull', () => {
      test('instanceof checks pass', () => {
        expect(Prisma.DbNull).toBeInstanceOf(Prisma.NullTypes.DbNull)
        expect(Prisma.JsonNull).toBeInstanceOf(Prisma.NullTypes.JsonNull)
        expect(Prisma.AnyNull).toBeInstanceOf(Prisma.NullTypes.AnyNull)
      })

      test('custom instances are not allowed', async () => {
        await expect(
          prisma.requiredJsonField.create({
            data: {
              // @ts-expect-error
              json: new Prisma.NullTypes.JsonNull(),
            },
          }),
        ).rejects.toMatchInlineSnapshot(`
                Error: Argument json: Provided value new Prisma.NullTypes.JsonNull() of type JsonNull on prisma.createOneRequiredJsonField is not a JsonNullValueInput.
                → Possible values: JsonNullValueInput.JsonNull

                    at Document.validate (/client/runtime/index.js:22979:20)
                    at PrismaClient.validate [as _executeRequest] (/client/runtime/index.js:25417:17)
                    at _executeRequest (/client/runtime/index.js:25354:23)
                    at consumer (/client/runtime/index.js:25358:76)
                    at cb (/client/runtime/index.js:24563:12)
                    at runInChildSpan (/client/runtime/index.js:25358:20)
                    at AsyncResource.runInAsyncScope (node:async_hooks:202:9)
                    at PrismaClient.runInAsyncScope [as _request] (/client/runtime/index.js:25357:86)
                    at _request (/client/runtime/index.js:24100:65)
                    at requestFn (/client/runtime/index.js:24113:18)
              `)
      })
    })
  },
  {
    optOut: {
      from: ['sqlite', 'sqlserver', 'mongodb'],
      reason: `
        sqlite - connector does not support Json type
        sqlserver - connector does not support Json type
        mongodb - doesn't use DbNull/JsonNull
      `,
    },
  },
)

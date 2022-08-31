import { getConfig, parseEnvValue } from '@prisma/internals'
import path from 'path'
import fs from 'fs/promises'

import { generateClient } from '../../../src/generation/generateClient'
import { getDMMF } from '../../../src/generation/getDMMF'
import type { NamedTestSuiteConfig } from './getTestSuiteInfo'
import {
  getTestSuiteFolderPath,
  getTestSuitePreviewFeatures,
  getTestSuiteSchema,
  getTestSuiteSchemaPath,
} from './getTestSuiteInfo'
import { setupTestSuiteDatabase, setupTestSuiteFiles } from './setupTestSuiteEnv'
import type { TestSuiteMeta } from './setupTestSuiteMatrix'

type SetupTestSuiteClientOptions = {
  suiteMeta: TestSuiteMeta
  suiteConfig: NamedTestSuiteConfig
  skipDb?: boolean
  skipCopy?: boolean
  schemaPath?: string
  suiteFolderPath?: string
  globalTypesOutputDir?: string
}

/**
 * Does the necessary setup to get a test suite client ready to run.
 * @param suiteMeta
 * @param suiteConfig
 * @returns loaded client module
 */
export async function setupTestSuiteClient({
  suiteMeta,
  suiteConfig,
  skipDb,
  skipCopy,
  schemaPath = getTestSuiteSchemaPath(suiteMeta, suiteConfig),
  suiteFolderPath = getTestSuiteFolderPath(suiteMeta, suiteConfig),
  globalTypesOutputDir = suiteFolderPath,
}: SetupTestSuiteClientOptions) {
  const previewFeatures = getTestSuitePreviewFeatures(suiteConfig.matrixOptions)
  const schema = await getTestSuiteSchema(suiteMeta, suiteConfig.matrixOptions)
  const dmmf = await getDMMF({ datamodel: schema, previewFeatures })
  const config = await getConfig({ datamodel: schema, ignoreEnvVarErrors: true })
  const generator = config.generators.find((g) => parseEnvValue(g.provider) === 'prisma-client-js')

  if (!skipCopy) {
    await setupTestSuiteFiles(suiteMeta, suiteConfig)
  }
  await fs.writeFile(schemaPath, schema)
  if (!skipDb) {
    await setupTestSuiteDatabase(suiteMeta, suiteConfig)
  }

  await generateClient({
    datamodel: schema,
    schemaPath,
    binaryPaths: { libqueryEngine: {}, queryEngine: {} },
    datasources: config.datasources,
    outputDir: path.join(suiteFolderPath, 'node_modules/@prisma/client'),
    copyRuntime: false,
    dmmf: dmmf,
    generator: generator,
    engineVersion: '0000000000000000000000000000000000000000',
    clientVersion: '0.0.0',
    transpile: false,
    testMode: true,
    activeProvider: suiteConfig.matrixOptions['provider'] as string,
    // Change \\ to / for windows support
    runtimeDirs: {
      node: [__dirname.replace(/\\/g, '/'), '..', '..', '..', 'runtime'].join('/'),
      edge: [__dirname.replace(/\\/g, '/'), '..', '..', '..', 'runtime', 'edge'].join('/'),
    },
    projectRoot: suiteFolderPath,
    dataProxy: !!process.env.DATA_PROXY,
  })

  await fs.writeFile(
    path.join(globalTypesOutputDir, '_globals.generated.ts'),
    getGlobalTypesFileContents(suiteFolderPath),
    'utf8',
  )

  return require(path.join(suiteFolderPath, 'node_modules/@prisma/client'))
}

function getGlobalTypesFileContents(suiteFolderPath: string) {
  return `
import { Prisma, PrismaClient} from '${suiteFolderPath}/node_modules/@prisma/client'

declare const prisma: PrismaClient;
declare const newPrismaClient: (...args: ConstructorParameters<typeof PrismaClient>) => PrismaClient

export { prisma, Prisma, newPrismaClient }
export type { PrismaClient }
`
}

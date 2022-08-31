import glob from 'globby'
import fs from 'fs/promises'
import path from 'path'
import { getTestSuiteConfigs, getTestSuiteMeta } from './getTestSuiteInfo'
import { setupTestSuiteClient } from './setupTestSuiteClient'
const testRoot = path.resolve(__dirname, '..')

export async function generateEditorTypes() {
  const testPaths = await glob('*/**/*.ts', {
    ignore: ['**/_*.ts', '*/.generated/**', '_utils/**', 'typescript/*'],
    cwd: testRoot,
    absolute: true,
  })

  for (const testPath of testPaths) {
    const meta = getTestSuiteMeta(testPath)
    const suiteConfigs = getTestSuiteConfigs(meta)
    const config = suiteConfigs[0]
    const testDir = path.dirname(testPath)

    const targetPath = path.join(testDir, '.editor-types')
    await fs.mkdir(targetPath, { recursive: true })
    const schemaPath = path.join(targetPath, 'schema.prisma')

    await setupTestSuiteClient({
      suiteMeta: meta,
      suiteConfig: config,
      skipDb: true,
      skipCopy: true,
      schemaPath,
      suiteFolderPath: targetPath,
      globalTypesOutputDir: testDir,
    })
  }
}

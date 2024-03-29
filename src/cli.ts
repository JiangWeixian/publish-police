import cac from 'cac'
import consola from 'consola'

import {
  distCheck,
  exportsCheck,
  resolveOptions,
} from './lib'

const cli = cac('publish-police')

cli
  .command('')
  .option('--strict', 'Strict mode', {
    default: true,
  })
  .action(async (options) => {
    const resolvedOptions = await resolveOptions({ root: process.cwd(), strict: options.strict })
    Promise.all([
      distCheck(resolvedOptions),
      exportsCheck(resolvedOptions),
    ]).catch((e: Error) => {
      consola.error(e.message)
      process.exit(1)
    })
    consola.success('All checks passed!')
  })

cli.parse()

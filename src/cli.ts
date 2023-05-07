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
  .action((options) => {
    const resolvedOptions = resolveOptions({ root: process.cwd(), strict: options.strict })
    Promise.all([
      distCheck(resolvedOptions),
      exportsCheck(resolvedOptions),
    ]).catch((e: Error) => {
      consola.error(e.message)
      process.exit(1)
    })
  })

cli.parse()

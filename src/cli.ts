import cac from 'cac'
import { distCheck } from './lib'
import consola from 'consola'

const cli = cac()

cli
  .command('')
  .option('--strict', 'Stric mode check', {
    default: true,
  })
  .action((options) => {
    distCheck({ strict: options.strict }).catch((e: Error) => {
      consola.error(e.message)
      process.exit(1)
    })
  })

cli.parse()

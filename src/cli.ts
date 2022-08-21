import cac from 'cac'
import { distCheck } from './lib'
import consola from 'consola'

const cli = cac('publish-police')

cli
  .command('')
  .option('--strict', 'Stric mode check', {
    default: true,
  })
  .action((options) => {
    distCheck({ strict: options.strict }).catch((e: Error) => {
      // catch error then manually print it, makesure changesets/action print to stderr
      consola.error(e.message)
      process.exit(1)
    })
  })

cli.parse()

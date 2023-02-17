import cac from 'cac'
import { filesCheck } from './lib'
import consola from 'consola'

const cli = cac('publish-police')

cli
  .command('')
  .option('--strict', 'Strict mode check', {
    default: true,
  })
  .action((options) => {
    filesCheck({ strict: options.strict }).catch((e: Error) => {
      // catch error then manually print it, makesure changesets/action print to stderr
      consola.error(e.message)
      process.exit(1)
    })
  })

cli.parse()

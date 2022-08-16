import cac from 'cac'
import { distCheck } from './lib'

const cli = cac()

cli
  .command('')
  .option('--strict', 'Choose a project type', {
    default: true,
  })
  .action((options) => {
    distCheck({ strict: options.strict })
  })

cli.parse()

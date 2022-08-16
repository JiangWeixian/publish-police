import cac from 'cac'
import { distCheck } from './lib'

const cli = cac()

cli
  .command('')
  .option('--strict [strict]', 'Choose a project type', {
    default: true,
  })
  .action((strict) => {
    distCheck({ strict })
  })

cli.parse()

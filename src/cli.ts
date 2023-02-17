import cac from 'cac'
import { filesCheck, mainCheck, exportsCheck } from './lib'
import Listr from 'listr'
import colors from 'picocolors'
// @ts-expect-error -- ignore types
import mlistr from 'listr-multiline-renderer'

const cli = cac('publish-police')

cli
  .command('')
  .option('--strict', '[boolean] Strict mode', {
    default: true,
  })
  .action(async (options) => {
    const tasks = new Listr(
      [
        {
          title: `Check ${colors.cyan('`files`')} field`,
          task: () => filesCheck({ strict: options.strict }),
        },
        { title: `Check ${colors.cyan('`main and module`')} field`, task: () => mainCheck({}) },
        { title: `Check ${colors.cyan('`exports`')} field`, task: () => exportsCheck({}) },
      ],
      { renderer: mlistr },
    )
    await tasks.run().catch(() => {
      process.exit(1)
    })
  })

cli.parse()

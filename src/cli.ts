import cac from 'cac'
import { filesCheck, mainCheck, exportsCheck, readPkgJson } from './lib'
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
    try {
      const pkg = readPkgJson(process.cwd())
      const tasks = new Listr(
        [
          {
            title: `Check ${colors.cyan('`files`')}`,
            task: () => filesCheck({ strict: options.strict, pkg }),
          },
          {
            title: `Check ${colors.cyan('`main and module`')}`,
            task: () => mainCheck({ pkg }),
          },
          { title: `Check ${colors.cyan('`exports`')}`, task: () => exportsCheck({ pkg }) },
        ],
        { renderer: mlistr },
      )
      tasks.run().catch(() => {
        process.exit(1)
      })
    } catch (e) {
      process.exit(0)
    }
  })

cli.parse()

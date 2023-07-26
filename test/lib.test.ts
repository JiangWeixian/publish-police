import path from 'node:path'

import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  distCheck,
  exportsCheck,
  glob,
  resolveOptions,
} from '../src/lib'

// TODO: replace absolute path with relative path
describe('resolve options', () => {
  it('resolve options', async () => {
    const resolvedOptions = await resolveOptions({ root: path.resolve(__dirname, './fixtures/basic'), strict: true })
    resolvedOptions.root = '<rootDir>'
    expect(resolvedOptions).toMatchSnapshot()
  })
})

describe('glob', () => {
  it('non exit files should return empty array', async () => {
    const results = await glob(['dist'])
    expect(results.length).toBe(1)
    expect(results[0].length).toBe(0)
  })

  it('exit files should return files list', async () => {
    const results = await glob(['bin'])
    expect(results.length).toBe(1)
    expect(results[0]).toMatchInlineSnapshot(`
    [
      "bin/index.mjs",
    ]
    `)
  })

  it('cwd should work', async () => {
    const results = await glob(['lib'], { root: path.resolve(__dirname, './fixtures/basic') })
    expect(results[0]).toMatchInlineSnapshot(`
      [
        "lib/.gitkeep",
      ]
    `)
  })

  it('default ignores should work', async () => {
    const results = await glob(['node_modules'])
    expect(results.length).toBe(1)
    expect(results[0].length).toBe(0)
  })
})

describe('dist-checker', () => {
  it('empty files should pass on non-strict mode', async () => {
    const resolvedOptions = await resolveOptions({ root: path.resolve(__dirname, './fixtures/empty'), strict: false })
    expect(
      await distCheck(resolvedOptions),
    ).toBe(true)
  })

  it('empty files should failed on strict mode', async () => {
    const resolvedOptions = await resolveOptions({ root: path.resolve(__dirname, './fixtures/empty'), strict: true })
    expect(
      async () =>
        await distCheck(resolvedOptions),
    ).to.rejects.toThrow('files in package.json not found!')
  })

  it('should work', async () => {
    const resolvedOptions = await resolveOptions({ root: path.resolve(__dirname, './fixtures/basic'), strict: false })
    const result = await distCheck(resolvedOptions)
    expect(result).toBe(true)
  })
})

describe('exports checker', () => {
  it('skip empty exports field', async () => {
    const resolvedOptions = await resolveOptions({ root: path.resolve(__dirname, './fixtures/empty'), strict: false })
    expect(
      await exportsCheck(resolvedOptions),
    ).toBe(true)
  })

  it('should throw on non-export files', async () => {
    const resolvedOptions = await resolveOptions({ root: path.resolve(__dirname, './fixtures/basic'), strict: false })
    expect(
      async () =>
        await exportsCheck(resolvedOptions),
    ).to.rejects.toThrow('./lib/cli.mjs looks like not exit!')
  })

  // package.json always include by npm
  it('should throw if files filed not empty and export file not include in files', async () => {
    const resolvedOptions = await resolveOptions({ root: path.resolve(__dirname, './fixtures/check-exports-in-files'), strict: false })
    expect(
      async () =>
        await exportsCheck(resolvedOptions),
    ).to.rejects.toThrow('./exports/test.js looks like not included in `files`!')
  })
})

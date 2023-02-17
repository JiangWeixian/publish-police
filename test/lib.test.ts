import { glob, filesCheck, mainCheck, exportsCheck, readPkgJson } from '../src/lib'
import { describe, it, expect, beforeAll } from 'vitest'
import path from 'path'

let emptyPkg: any = {}
let basicPkg: any = {}
beforeAll(() => {
  emptyPkg = readPkgJson(path.resolve(__dirname, './fixtures/empty'))
  basicPkg = readPkgJson(path.resolve(__dirname, './fixtures/basic'))
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
    const results = await glob(['lib'], { cwd: path.resolve(__dirname, './fixtures/basic') })
    expect(results[0]).toMatchInlineSnapshot(`
      [
        "lib/.gitkeep",
        "lib/main.js",
      ]
    `)
  })

  it('default ignores should work', async () => {
    const results = await glob(['node_modules'])
    expect(results.length).toBe(1)
    expect(results[0].length).toBe(0)
  })
})

describe('files-checker', () => {
  it('non-strict mode should work', async () => {
    expect(
      await filesCheck({
        strict: false,
        cwd: path.resolve(__dirname, './fixtures/empty'),
        pkg: emptyPkg,
      }),
    ).toBe(true)
  })

  it('strict mode should work', async () => {
    expect(
      async () =>
        await filesCheck({
          strict: true,
          cwd: path.resolve(__dirname, './fixtures/empty'),
          pkg: emptyPkg,
        }),
    ).rejects.toThrow('In strict mode, non-empty `files` is required in package.json!')
  })

  it('should work', async () => {
    const result = await filesCheck({
      cwd: path.resolve(__dirname, './fixtures/basic'),
      pkg: basicPkg,
    })
    expect(result).toBe(true)
  })
})

describe('main checker', () => {
  it('should work', () => {
    expect(
      mainCheck({ cwd: path.resolve(__dirname, './fixtures/basic'), pkg: basicPkg }),
    ).resolves.toBe(true)
  })
  it('throw error if empty main or module field', () => {
    expect(
      mainCheck({ cwd: path.resolve(__dirname, './fixtures/empty'), pkg: emptyPkg }),
    ).to.rejects.toThrowError()
  })
})

describe('exports checker', () => {
  it('should work', () => {
    expect(
      exportsCheck({ cwd: path.resolve(__dirname, './fixtures/basic'), pkg: basicPkg }),
    ).resolves.toBe(true)
  })
  it('throw error sub-export not exit', () => {
    expect(
      exportsCheck({ cwd: path.resolve(__dirname, './fixtures/empty'), pkg: emptyPkg }),
    ).to.rejects.toThrowError()
  })
})

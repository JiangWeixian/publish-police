import { glob, filesCheck, mainCheck, exportsCheck } from '../src/lib'
import { describe, it, expect } from 'vitest'
import path from 'path'

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
      await filesCheck({ strict: false, cwd: path.resolve(__dirname, './fixtures/empty') }),
    ).toBe(true)
  })

  it('strict mode should work', async () => {
    expect(
      async () =>
        await filesCheck({ strict: true, cwd: path.resolve(__dirname, './fixtures/empty') }),
    ).to.rejects.toThrow('files in package.json not found!')
  })

  it('should work', async () => {
    const result = await filesCheck({
      strict: false,
      cwd: path.resolve(__dirname, './fixtures/basic'),
    })
    expect(result).toBe(true)
  })
})

describe('main checker', () => {
  it('should work', () => {
    mainCheck({ cwd: path.resolve(__dirname, './fixtures/basic') })
  })
  it('throw error if empty main or module field', () => {
    mainCheck({ cwd: path.resolve(__dirname, './fixtures/empty') })
  })
})

describe('exports checker', () => {
  it('should work', () => {
    exportsCheck({ cwd: path.resolve(__dirname, './fixtures/basic') })
  })
  it('throw error if empty main or module field', () => {
    exportsCheck({ cwd: path.resolve(__dirname, './fixtures/empty') })
  })
})

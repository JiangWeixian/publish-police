import { glob, distCheck } from '../src/lib'
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
    const results = await glob(['lib'], { cwd: path.resolve(__dirname, './fixtures') })
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

  it('.npmignore should work', async () => {
    const results = await glob(['.changeset'])
    expect(results.length).toBe(1)
    expect(results[0].length).toBe(0)
  })
})

describe('dist-checker', () => {
  it('non-strict mode should work', async () => {
    expect(await distCheck({ strict: false })).toBe(true)
  })

  it('strict mode should work', async () => {
    expect(async () => await distCheck({ strict: true })).to.rejects.toThrow(
      'files in package.json not found!',
    )
  })

  it('should work', async () => {
    expect(await distCheck({ strict: false, cwd: path.resolve(__dirname, './fixtures') })).toBe(
      true,
    )
  })
})

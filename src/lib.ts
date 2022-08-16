import { readJson } from 'fs-extra'
import type { PackageJson } from 'type-fest'
import { globby } from 'globby'

type Options = {
  cwd?: string
}

// https://docs.npmjs.com/cli/v8/configuring-npm/package-json#files
const DefaultIgnore = [
  '.git',
  'CVS',
  '.svn',
  '.hg',
  '.lock-wscript',
  '.wafpickle-N',
  '.*.swp',
  '.DS_Store',
  '._*',
  'npm-debug.log',
  '.npmrc',
  'node_modules',
  'config.gypi',
  '*.orig',
  'package-lock.json',
  'node_modules',
]

export const glob = async (files: string[], options: Options) => {
  const results = await Promise.all(
    files.map((file) =>
      globby(file, {
        ignore: DefaultIgnore,
        ignoreFiles: ['.npmignore'],
        gitignore: true,
        ...options,
      }),
    ),
  )
  return results
}

export const distCheck = async (options: Options) => {
  let files: string[] | undefined
  try {
    const config: PackageJson = await readJson(`${options.cwd}/package.json`)
    files = config.files
  } catch (_) {}
  if (!files) {
    throw new Error('files in package.json not found!')
  }
  const results = await glob(files, options)
  return results.every((f) => !f.length)
}

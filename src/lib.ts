import { readFileSync } from 'fs'
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

export const glob = async (files: string[], options: Options = { cwd: process.cwd() }) => {
  const results = await Promise.all(
    files.map((file) =>
      globby(file, {
        ignore: DefaultIgnore,
        ignoreFiles: ['.npmignore'],
        gitignore: true,
        dot: true,
        ...options,
      }),
    ),
  )
  return results
}

export const distCheck = async ({
  strict = true,
  cwd = process.cwd(),
}: Options & { strict?: boolean }) => {
  let files: string[] = []
  try {
    const config: PackageJson = JSON.parse(readFileSync(`${cwd}/package.json`).toString('utf-8'))
    files = config.files ?? []
  } catch (_) {
    throw new Error('package.json not found!')
  }
  if (files.length === 0 && strict) {
    throw new Error('files in package.json not found!')
  }
  // in non-strict mode, empty files is allowed
  // npm will always upload files in current directory
  if (files.length === 0 && !strict) {
    return true
  }
  const results = await glob(files, { cwd })
  for (const [index, pattern] of files.entries()) {
    if (!results[index].length) {
      throw new Error(
        `\`${pattern}\` looks like empty or not exit! Maybe you add it in ignore files or build failed?`,
      )
    }
  }
  return true
}

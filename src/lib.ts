import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { globby } from 'globby'
import {
  forEach,
  isEmpty,
  isObject,
  isString,
} from 'lodash-es'

import type { PackageJson } from 'type-fest'

interface Options {
  root?: string
  /**
   * @description Stric check
   * - true
   *  If files not defined, will throw error.
   * @default true
   */
  strict?: boolean
}

interface ResolvedOptions {
  root: string
  strict: boolean
  packageJson: PackageJson
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

export const glob = async (files: string[], options: Pick<Options, 'root'> = { root: process.cwd() }) => {
  const results = await Promise.all(
    files.map(file =>
      globby(file, {
        ignore: DefaultIgnore,
        dot: true,
        cwd: options.root,
      }),
    ),
  )
  return results
}

export const resolveOptions = ({ root = process.cwd(), strict = true }: Options): ResolvedOptions => {
  let packageJson: PackageJson = {}
  try {
    packageJson = JSON.parse(readFileSync(`${root}/package.json`).toString('utf-8'))
  } catch (e) {
    throw new Error('package.json not found!')
  }
  return {
    packageJson,
    root,
    strict,
  }
}

/**
 * @description Check files field in `package.json`
 */
export const distCheck = async ({ strict, packageJson, root }: ResolvedOptions) => {
  const files: string[] = packageJson.files ?? []
  if (files.length === 0 && strict) {
    throw new Error('files in package.json not found!')
  }
  // in non-strict mode, empty files is allowed
  // npm will always upload files in current directory
  if (files.length === 0 && !strict) {
    return true
  }
  const results = await glob(files, { root })
  for (const [index, pattern] of files.entries()) {
    if (!results[index].length) {
      throw new Error(
        `\`${pattern}\` looks like empty or not exit! Maybe you add it in ignore files or build failed?`,
      )
    }
  }
  return true
}

/**
 * @description Check exports field in `package.json`
 */
export const exportsCheck = async ({ packageJson, root }: ResolvedOptions): Promise<boolean> => {
  const exports = packageJson.exports ?? {}
  // Skip exports field not defined
  // SKip empty exports field
  if (!exports || (isObject(exports) && isEmpty(exports))) {
    return true
  }
  const check = (exportedValue: NonNullable<PackageJson['exports']>) => {
    if (isString(exportedValue)) {
      const filepath = resolve(root, exportedValue)
      if (!existsSync(filepath)) {
        throw new Error(`${exportedValue} looks like not exit!`)
      }
      return
    }
    forEach(exportedValue, (value) => {
      if (isObject(value) || isString(value)) {
        check(value as NonNullable<PackageJson['exports']>)
      }
    })
  }
  check(exports)
  return true
}

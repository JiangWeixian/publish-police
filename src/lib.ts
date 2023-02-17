import { readFileSync, existsSync } from 'fs'
import path from 'path'
import type { PackageJson } from 'type-fest'
import { globby } from 'globby'
import { pickBy, isObject, isEmpty } from 'lodash-es'
import colors from 'picocolors'

interface Options {
  pkg?: PackageJson
  cwd?: string
}

interface CheckOptions extends Options {
  strict?: boolean
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
        dot: true,
        ...options,
      }),
    ),
  )
  return results
}

export const readPkgJson = (cwd = process.cwd()) => {
  try {
    const config: PackageJson = JSON.parse(readFileSync(`${cwd}/package.json`).toString('utf-8'))
    return config
  } catch (_) {
    throw new Error('package.json not found!')
  }
}

function omitByDeep(
  obj: Record<string, any> | string[],
  predicate: (value: any, key: string | number) => boolean,
) {
  if (Array.isArray(obj)) {
    return obj.filter((value, key) => !predicate(value, key))
  }
  return pickBy(obj, (value, key): boolean => {
    if (isObject(value)) {
      return !isEmpty(omitByDeep(value, predicate))
    }
    return !predicate(value, key)
  })
}

/**
 * @description Check patterns listed in `files` field exist or not
 */
export const filesCheck = async ({ strict = true, pkg, cwd = process.cwd() }: CheckOptions) => {
  const files: string[] = pkg?.files ?? []
  if (files.length === 0 && strict) {
    throw new Error('In strict mode, non-empty `files` is required in package.json!')
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
        `${colors.red(
          `"files": ["${pattern}"]`,
        )} looks like empty or not exist! Maybe you add it in ignore files by mistake or forget to exec build script?`,
      )
    }
  }
  return true
}

/**
 * @description Check `main & module` field file exist or not
 */
export const mainCheck = async ({ cwd = process.cwd(), pkg }: CheckOptions) => {
  if (pkg?.main && !existsSync(path.resolve(cwd, pkg.main))) {
    throw new Error(
      `${colors.red(
        `"main": ${pkg.main}`,
      )} is not exist! Maybe you add it in ignore files by mistake or forget to exec build script?`,
    )
  }
  if (pkg?.module && !existsSync(path.resolve(cwd, pkg.module))) {
    throw new Error(
      `${colors.red(
        `"module": ${pkg.main}`,
      )} is not exist! Maybe you add it in ignore files by mistake or forget to exec build script?`,
    )
  }
  return true
}

/**
 * @description Check `exports` field file exist or not
 */
export const exportsCheck = async ({ cwd = process.cwd(), pkg }: CheckOptions) => {
  const exportsField = pkg?.exports
  if (!exportsField) {
    return
  }
  const result = omitByDeep(
    typeof exportsField === 'string' ? [exportsField] : exportsField,
    (pattern) => {
      const isExist = existsSync(path.resolve(cwd, pattern))
      return isExist
    },
  )
  if (!isEmpty(result)) {
    const msg = `sub-exports listed in \n${JSON.stringify(
      result,
      null,
      2,
    )} \nlooks like are not exist! Maybe you add it in ignore files by mistake or forget to exec build script?`
    throw new Error(msg)
  }
  return true
}

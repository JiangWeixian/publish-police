import { readFileSync, existsSync } from 'fs'
import path from 'path'
import type { PackageJson } from 'type-fest'
import { globby } from 'globby'
import { forEach, isObject } from 'lodash-es'

interface Options {
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

function eachDeep(
  obj: Record<string, any> | string[],
  callback: (v: any, key: string, path: string) => void,
  parentPath = '',
) {
  forEach(obj, (value, key) => {
    const subpath = parentPath ? `${parentPath}/${key}` : key
    if (isObject(value)) {
      eachDeep(value, callback, subpath)
    } else {
      callback(value, key, subpath)
    }
  })
}

/**
 * @description Check patterns listed in `files` field exist or not
 */
export const filesCheck = async ({ strict = true, cwd = process.cwd() }: CheckOptions) => {
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
        `\`${pattern}\` looks like empty or not exist! Maybe you add it in ignore files or build failed?`,
      )
    }
  }
  return true
}

/**
 * @description Check `main & module` field file exist or not
 */
export const mainCheck = async ({ cwd = process.cwd() }: CheckOptions) => {
  const pkg = readPkgJson(cwd)
  if (pkg.main && !existsSync(path.resolve(cwd, pkg.main))) {
    console.log(`main: ${pkg.main} is not exist!`)
  }
  if (pkg.module && !existsSync(path.resolve(cwd, pkg.module))) {
    console.log(`module: ${pkg.module} is not exist!`)
  }
}

/**
 * @description Check `main & module` field file exist or not
 */
export const exportsCheck = async ({ cwd = process.cwd() }: CheckOptions) => {
  const exportsField = readPkgJson(cwd)?.exports
  if (!exportsField) {
    return
  }
  const patterns: { subpath: string; pattern: string }[] = []
  eachDeep(
    typeof exportsField === 'string' ? [exportsField] : exportsField,
    (pattern, _, subpath) => {
      const isExist = existsSync(path.resolve(cwd, pattern))
      !isExist && patterns.push({ subpath, pattern })
    },
  )
  if (patterns.length !== 0) {
    const msg = `${patterns.map((v) => `${v.subpath}: ${v.pattern}`).join('\n')} are not exist!`
    console.log(msg)
  }
}

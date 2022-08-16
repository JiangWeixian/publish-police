import cac from 'cac';
import { readJson } from 'fs-extra';
import { globby } from 'globby';

const DefaultIgnore = [
  ".git",
  "CVS",
  ".svn",
  ".hg",
  ".lock-wscript",
  ".wafpickle-N",
  ".*.swp",
  ".DS_Store",
  "._*",
  "npm-debug.log",
  ".npmrc",
  "node_modules",
  "config.gypi",
  "*.orig",
  "package-lock.json",
  "node_modules"
];
const glob = async (files, options = { cwd: process.cwd() }) => {
  const results = await Promise.all(files.map((file) => globby(file, {
    ignore: DefaultIgnore,
    ignoreFiles: [".npmignore"],
    gitignore: true,
    dot: true,
    ...options
  })));
  return results;
};
const distCheck = async ({
  strict = true,
  cwd = process.cwd()
}) => {
  let files = [];
  try {
    const config = await readJson(`${cwd}/package.json`);
    files = config.files ?? [];
  } catch (_) {
    throw new Error("package.json not found!");
  }
  if (files.length === 0 && strict) {
    throw new Error("files in package.json not found!");
  }
  if (files.length === 0 && !strict) {
    return true;
  }
  const results = await glob(files, { cwd });
  for (const [index, pattern] of files.entries()) {
    if (!results[index].length) {
      throw new Error(`\`${pattern}\` looks like empty or not exit! Maybe you add it in ignore files or build failed?`);
    }
  }
  return true;
};

const cli = cac();
cli.command("").option("--strict", "Choose a project type", {
  default: true
}).action((options) => {
  distCheck({ strict: options.strict });
});
cli.parse();
//# sourceMappingURL=cli.mjs.map

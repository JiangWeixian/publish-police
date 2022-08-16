import require$$0$5, { EventEmitter } from 'events';
import require$$0$2 from 'fs';
import require$$0 from 'constants';
import require$$0$1 from 'stream';
import require$$0$3 from 'util';
import require$$5 from 'assert';
import require$$0$4 from 'path';
import require$$2 from 'os';
import process$1 from 'process';
import { fileURLToPath } from 'url';

function toArr(any) {
	return any == null ? [] : Array.isArray(any) ? any : [any];
}

function toVal(out, key, val, opts) {
	var x, old=out[key], nxt=(
		!!~opts.string.indexOf(key) ? (val == null || val === true ? '' : String(val))
		: typeof val === 'boolean' ? val
		: !!~opts.boolean.indexOf(key) ? (val === 'false' ? false : val === 'true' || (out._.push((x = +val,x * 0 === 0) ? x : val),!!val))
		: (x = +val,x * 0 === 0) ? x : val
	);
	out[key] = old == null ? nxt : (Array.isArray(old) ? old.concat(nxt) : [old, nxt]);
}

function mri2 (args, opts) {
	args = args || [];
	opts = opts || {};

	var k, arr, arg, name, val, out={ _:[] };
	var i=0, j=0, idx=0, len=args.length;

	const alibi = opts.alias !== void 0;
	const strict = opts.unknown !== void 0;
	const defaults = opts.default !== void 0;

	opts.alias = opts.alias || {};
	opts.string = toArr(opts.string);
	opts.boolean = toArr(opts.boolean);

	if (alibi) {
		for (k in opts.alias) {
			arr = opts.alias[k] = toArr(opts.alias[k]);
			for (i=0; i < arr.length; i++) {
				(opts.alias[arr[i]] = arr.concat(k)).splice(i, 1);
			}
		}
	}

	for (i=opts.boolean.length; i-- > 0;) {
		arr = opts.alias[opts.boolean[i]] || [];
		for (j=arr.length; j-- > 0;) opts.boolean.push(arr[j]);
	}

	for (i=opts.string.length; i-- > 0;) {
		arr = opts.alias[opts.string[i]] || [];
		for (j=arr.length; j-- > 0;) opts.string.push(arr[j]);
	}

	if (defaults) {
		for (k in opts.default) {
			name = typeof opts.default[k];
			arr = opts.alias[k] = opts.alias[k] || [];
			if (opts[name] !== void 0) {
				opts[name].push(k);
				for (i=0; i < arr.length; i++) {
					opts[name].push(arr[i]);
				}
			}
		}
	}

	const keys = strict ? Object.keys(opts.alias) : [];

	for (i=0; i < len; i++) {
		arg = args[i];

		if (arg === '--') {
			out._ = out._.concat(args.slice(++i));
			break;
		}

		for (j=0; j < arg.length; j++) {
			if (arg.charCodeAt(j) !== 45) break; // "-"
		}

		if (j === 0) {
			out._.push(arg);
		} else if (arg.substring(j, j + 3) === 'no-') {
			name = arg.substring(j + 3);
			if (strict && !~keys.indexOf(name)) {
				return opts.unknown(arg);
			}
			out[name] = false;
		} else {
			for (idx=j+1; idx < arg.length; idx++) {
				if (arg.charCodeAt(idx) === 61) break; // "="
			}

			name = arg.substring(j, idx);
			val = arg.substring(++idx) || (i+1 === len || (''+args[i+1]).charCodeAt(0) === 45 || args[++i]);
			arr = (j === 2 ? [name] : name);

			for (idx=0; idx < arr.length; idx++) {
				name = arr[idx];
				if (strict && !~keys.indexOf(name)) return opts.unknown('-'.repeat(j) + name);
				toVal(out, name, (idx + 1 < arr.length) || val, opts);
			}
		}
	}

	if (defaults) {
		for (k in opts.default) {
			if (out[k] === void 0) {
				out[k] = opts.default[k];
			}
		}
	}

	if (alibi) {
		for (k in out) {
			arr = opts.alias[k] || [];
			while (arr.length > 0) {
				out[arr.shift()] = out[k];
			}
		}
	}

	return out;
}

const removeBrackets = (v) => v.replace(/[<[].+/, "").trim();
const findAllBrackets = (v) => {
  const ANGLED_BRACKET_RE_GLOBAL = /<([^>]+)>/g;
  const SQUARE_BRACKET_RE_GLOBAL = /\[([^\]]+)\]/g;
  const res = [];
  const parse = (match) => {
    let variadic = false;
    let value = match[1];
    if (value.startsWith("...")) {
      value = value.slice(3);
      variadic = true;
    }
    return {
      required: match[0].startsWith("<"),
      value,
      variadic
    };
  };
  let angledMatch;
  while (angledMatch = ANGLED_BRACKET_RE_GLOBAL.exec(v)) {
    res.push(parse(angledMatch));
  }
  let squareMatch;
  while (squareMatch = SQUARE_BRACKET_RE_GLOBAL.exec(v)) {
    res.push(parse(squareMatch));
  }
  return res;
};
const getMriOptions = (options) => {
  const result = {alias: {}, boolean: []};
  for (const [index, option] of options.entries()) {
    if (option.names.length > 1) {
      result.alias[option.names[0]] = option.names.slice(1);
    }
    if (option.isBoolean) {
      if (option.negated) {
        const hasStringTypeOption = options.some((o, i) => {
          return i !== index && o.names.some((name) => option.names.includes(name)) && typeof o.required === "boolean";
        });
        if (!hasStringTypeOption) {
          result.boolean.push(option.names[0]);
        }
      } else {
        result.boolean.push(option.names[0]);
      }
    }
  }
  return result;
};
const findLongest = (arr) => {
  return arr.sort((a, b) => {
    return a.length > b.length ? -1 : 1;
  })[0];
};
const padRight = (str, length) => {
  return str.length >= length ? str : `${str}${" ".repeat(length - str.length)}`;
};
const camelcase = (input) => {
  return input.replace(/([a-z])-([a-z])/g, (_, p1, p2) => {
    return p1 + p2.toUpperCase();
  });
};
const setDotProp = (obj, keys, val) => {
  let i = 0;
  let length = keys.length;
  let t = obj;
  let x;
  for (; i < length; ++i) {
    x = t[keys[i]];
    t = t[keys[i]] = i === length - 1 ? val : x != null ? x : !!~keys[i + 1].indexOf(".") || !(+keys[i + 1] > -1) ? {} : [];
  }
};
const setByType = (obj, transforms) => {
  for (const key of Object.keys(transforms)) {
    const transform = transforms[key];
    if (transform.shouldTransform) {
      obj[key] = Array.prototype.concat.call([], obj[key]);
      if (typeof transform.transformFunction === "function") {
        obj[key] = obj[key].map(transform.transformFunction);
      }
    }
  }
};
const getFileName = (input) => {
  const m = /([^\\\/]+)$/.exec(input);
  return m ? m[1] : "";
};
const camelcaseOptionName = (name) => {
  return name.split(".").map((v, i) => {
    return i === 0 ? camelcase(v) : v;
  }).join(".");
};
class CACError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }
}

class Option {
  constructor(rawName, description, config) {
    this.rawName = rawName;
    this.description = description;
    this.config = Object.assign({}, config);
    rawName = rawName.replace(/\.\*/g, "");
    this.negated = false;
    this.names = removeBrackets(rawName).split(",").map((v) => {
      let name = v.trim().replace(/^-{1,2}/, "");
      if (name.startsWith("no-")) {
        this.negated = true;
        name = name.replace(/^no-/, "");
      }
      return camelcaseOptionName(name);
    }).sort((a, b) => a.length > b.length ? 1 : -1);
    this.name = this.names[this.names.length - 1];
    if (this.negated && this.config.default == null) {
      this.config.default = true;
    }
    if (rawName.includes("<")) {
      this.required = true;
    } else if (rawName.includes("[")) {
      this.required = false;
    } else {
      this.isBoolean = true;
    }
  }
}

const processArgs = process.argv;
const platformInfo = `${process.platform}-${process.arch} node-${process.version}`;

class Command {
  constructor(rawName, description, config = {}, cli) {
    this.rawName = rawName;
    this.description = description;
    this.config = config;
    this.cli = cli;
    this.options = [];
    this.aliasNames = [];
    this.name = removeBrackets(rawName);
    this.args = findAllBrackets(rawName);
    this.examples = [];
  }
  usage(text) {
    this.usageText = text;
    return this;
  }
  allowUnknownOptions() {
    this.config.allowUnknownOptions = true;
    return this;
  }
  ignoreOptionDefaultValue() {
    this.config.ignoreOptionDefaultValue = true;
    return this;
  }
  version(version, customFlags = "-v, --version") {
    this.versionNumber = version;
    this.option(customFlags, "Display version number");
    return this;
  }
  example(example) {
    this.examples.push(example);
    return this;
  }
  option(rawName, description, config) {
    const option = new Option(rawName, description, config);
    this.options.push(option);
    return this;
  }
  alias(name) {
    this.aliasNames.push(name);
    return this;
  }
  action(callback) {
    this.commandAction = callback;
    return this;
  }
  isMatched(name) {
    return this.name === name || this.aliasNames.includes(name);
  }
  get isDefaultCommand() {
    return this.name === "" || this.aliasNames.includes("!");
  }
  get isGlobalCommand() {
    return this instanceof GlobalCommand;
  }
  hasOption(name) {
    name = name.split(".")[0];
    return this.options.find((option) => {
      return option.names.includes(name);
    });
  }
  outputHelp() {
    const {name, commands} = this.cli;
    const {
      versionNumber,
      options: globalOptions,
      helpCallback
    } = this.cli.globalCommand;
    let sections = [
      {
        body: `${name}${versionNumber ? `/${versionNumber}` : ""}`
      }
    ];
    sections.push({
      title: "Usage",
      body: `  $ ${name} ${this.usageText || this.rawName}`
    });
    const showCommands = (this.isGlobalCommand || this.isDefaultCommand) && commands.length > 0;
    if (showCommands) {
      const longestCommandName = findLongest(commands.map((command) => command.rawName));
      sections.push({
        title: "Commands",
        body: commands.map((command) => {
          return `  ${padRight(command.rawName, longestCommandName.length)}  ${command.description}`;
        }).join("\n")
      });
      sections.push({
        title: `For more info, run any command with the \`--help\` flag`,
        body: commands.map((command) => `  $ ${name}${command.name === "" ? "" : ` ${command.name}`} --help`).join("\n")
      });
    }
    let options = this.isGlobalCommand ? globalOptions : [...this.options, ...globalOptions || []];
    if (!this.isGlobalCommand && !this.isDefaultCommand) {
      options = options.filter((option) => option.name !== "version");
    }
    if (options.length > 0) {
      const longestOptionName = findLongest(options.map((option) => option.rawName));
      sections.push({
        title: "Options",
        body: options.map((option) => {
          return `  ${padRight(option.rawName, longestOptionName.length)}  ${option.description} ${option.config.default === void 0 ? "" : `(default: ${option.config.default})`}`;
        }).join("\n")
      });
    }
    if (this.examples.length > 0) {
      sections.push({
        title: "Examples",
        body: this.examples.map((example) => {
          if (typeof example === "function") {
            return example(name);
          }
          return example;
        }).join("\n")
      });
    }
    if (helpCallback) {
      sections = helpCallback(sections) || sections;
    }
    console.log(sections.map((section) => {
      return section.title ? `${section.title}:
${section.body}` : section.body;
    }).join("\n\n"));
  }
  outputVersion() {
    const {name} = this.cli;
    const {versionNumber} = this.cli.globalCommand;
    if (versionNumber) {
      console.log(`${name}/${versionNumber} ${platformInfo}`);
    }
  }
  checkRequiredArgs() {
    const minimalArgsCount = this.args.filter((arg) => arg.required).length;
    if (this.cli.args.length < minimalArgsCount) {
      throw new CACError(`missing required args for command \`${this.rawName}\``);
    }
  }
  checkUnknownOptions() {
    const {options, globalCommand} = this.cli;
    if (!this.config.allowUnknownOptions) {
      for (const name of Object.keys(options)) {
        if (name !== "--" && !this.hasOption(name) && !globalCommand.hasOption(name)) {
          throw new CACError(`Unknown option \`${name.length > 1 ? `--${name}` : `-${name}`}\``);
        }
      }
    }
  }
  checkOptionValue() {
    const {options: parsedOptions, globalCommand} = this.cli;
    const options = [...globalCommand.options, ...this.options];
    for (const option of options) {
      const value = parsedOptions[option.name.split(".")[0]];
      if (option.required) {
        const hasNegated = options.some((o) => o.negated && o.names.includes(option.name));
        if (value === true || value === false && !hasNegated) {
          throw new CACError(`option \`${option.rawName}\` value is missing`);
        }
      }
    }
  }
}
class GlobalCommand extends Command {
  constructor(cli) {
    super("@@global@@", "", {}, cli);
  }
}

var __assign = Object.assign;
class CAC extends EventEmitter {
  constructor(name = "") {
    super();
    this.name = name;
    this.commands = [];
    this.rawArgs = [];
    this.args = [];
    this.options = {};
    this.globalCommand = new GlobalCommand(this);
    this.globalCommand.usage("<command> [options]");
  }
  usage(text) {
    this.globalCommand.usage(text);
    return this;
  }
  command(rawName, description, config) {
    const command = new Command(rawName, description || "", config, this);
    command.globalCommand = this.globalCommand;
    this.commands.push(command);
    return command;
  }
  option(rawName, description, config) {
    this.globalCommand.option(rawName, description, config);
    return this;
  }
  help(callback) {
    this.globalCommand.option("-h, --help", "Display this message");
    this.globalCommand.helpCallback = callback;
    this.showHelpOnExit = true;
    return this;
  }
  version(version, customFlags = "-v, --version") {
    this.globalCommand.version(version, customFlags);
    this.showVersionOnExit = true;
    return this;
  }
  example(example) {
    this.globalCommand.example(example);
    return this;
  }
  outputHelp() {
    if (this.matchedCommand) {
      this.matchedCommand.outputHelp();
    } else {
      this.globalCommand.outputHelp();
    }
  }
  outputVersion() {
    this.globalCommand.outputVersion();
  }
  setParsedInfo({args, options}, matchedCommand, matchedCommandName) {
    this.args = args;
    this.options = options;
    if (matchedCommand) {
      this.matchedCommand = matchedCommand;
    }
    if (matchedCommandName) {
      this.matchedCommandName = matchedCommandName;
    }
    return this;
  }
  unsetMatchedCommand() {
    this.matchedCommand = void 0;
    this.matchedCommandName = void 0;
  }
  parse(argv = processArgs, {
    run = true
  } = {}) {
    this.rawArgs = argv;
    if (!this.name) {
      this.name = argv[1] ? getFileName(argv[1]) : "cli";
    }
    let shouldParse = true;
    for (const command of this.commands) {
      const parsed = this.mri(argv.slice(2), command);
      const commandName = parsed.args[0];
      if (command.isMatched(commandName)) {
        shouldParse = false;
        const parsedInfo = __assign(__assign({}, parsed), {
          args: parsed.args.slice(1)
        });
        this.setParsedInfo(parsedInfo, command, commandName);
        this.emit(`command:${commandName}`, command);
      }
    }
    if (shouldParse) {
      for (const command of this.commands) {
        if (command.name === "") {
          shouldParse = false;
          const parsed = this.mri(argv.slice(2), command);
          this.setParsedInfo(parsed, command);
          this.emit(`command:!`, command);
        }
      }
    }
    if (shouldParse) {
      const parsed = this.mri(argv.slice(2));
      this.setParsedInfo(parsed);
    }
    if (this.options.help && this.showHelpOnExit) {
      this.outputHelp();
      run = false;
      this.unsetMatchedCommand();
    }
    if (this.options.version && this.showVersionOnExit && this.matchedCommandName == null) {
      this.outputVersion();
      run = false;
      this.unsetMatchedCommand();
    }
    const parsedArgv = {args: this.args, options: this.options};
    if (run) {
      this.runMatchedCommand();
    }
    if (!this.matchedCommand && this.args[0]) {
      this.emit("command:*");
    }
    return parsedArgv;
  }
  mri(argv, command) {
    const cliOptions = [
      ...this.globalCommand.options,
      ...command ? command.options : []
    ];
    const mriOptions = getMriOptions(cliOptions);
    let argsAfterDoubleDashes = [];
    const doubleDashesIndex = argv.indexOf("--");
    if (doubleDashesIndex > -1) {
      argsAfterDoubleDashes = argv.slice(doubleDashesIndex + 1);
      argv = argv.slice(0, doubleDashesIndex);
    }
    let parsed = mri2(argv, mriOptions);
    parsed = Object.keys(parsed).reduce((res, name) => {
      return __assign(__assign({}, res), {
        [camelcaseOptionName(name)]: parsed[name]
      });
    }, {_: []});
    const args = parsed._;
    const options = {
      "--": argsAfterDoubleDashes
    };
    const ignoreDefault = command && command.config.ignoreOptionDefaultValue ? command.config.ignoreOptionDefaultValue : this.globalCommand.config.ignoreOptionDefaultValue;
    let transforms = Object.create(null);
    for (const cliOption of cliOptions) {
      if (!ignoreDefault && cliOption.config.default !== void 0) {
        for (const name of cliOption.names) {
          options[name] = cliOption.config.default;
        }
      }
      if (Array.isArray(cliOption.config.type)) {
        if (transforms[cliOption.name] === void 0) {
          transforms[cliOption.name] = Object.create(null);
          transforms[cliOption.name]["shouldTransform"] = true;
          transforms[cliOption.name]["transformFunction"] = cliOption.config.type[0];
        }
      }
    }
    for (const key of Object.keys(parsed)) {
      if (key !== "_") {
        const keys = key.split(".");
        setDotProp(options, keys, parsed[key]);
        setByType(options, transforms);
      }
    }
    return {
      args,
      options
    };
  }
  runMatchedCommand() {
    const {args, options, matchedCommand: command} = this;
    if (!command || !command.commandAction)
      return;
    command.checkUnknownOptions();
    command.checkOptionValue();
    command.checkRequiredArgs();
    const actionArgs = [];
    command.args.forEach((arg, index) => {
      if (arg.variadic) {
        actionArgs.push(args.slice(index));
      } else {
        actionArgs.push(args[index]);
      }
    });
    actionArgs.push(options);
    return command.commandAction.apply(this, actionArgs);
  }
}

const cac = (name = "") => new CAC(name);

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

var fs$r = {};

var universalify$1 = {};

universalify$1.fromCallback = function (fn) {
  return Object.defineProperty(function (...args) {
    if (typeof args[args.length - 1] === 'function') fn.apply(this, args);
    else {
      return new Promise((resolve, reject) => {
        fn.call(
          this,
          ...args,
          (err, res) => (err != null) ? reject(err) : resolve(res)
        );
      })
    }
  }, 'name', { value: fn.name })
};

universalify$1.fromPromise = function (fn) {
  return Object.defineProperty(function (...args) {
    const cb = args[args.length - 1];
    if (typeof cb !== 'function') return fn.apply(this, args)
    else fn.apply(this, args.slice(0, -1)).then(r => cb(null, r), cb);
  }, 'name', { value: fn.name })
};

var constants$5 = require$$0;

var origCwd = process.cwd;
var cwd = null;

var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform;

process.cwd = function() {
  if (!cwd)
    cwd = origCwd.call(process);
  return cwd
};
try {
  process.cwd();
} catch (er) {}

// This check is needed until node.js 12 is required
if (typeof process.chdir === 'function') {
  var chdir = process.chdir;
  process.chdir = function (d) {
    cwd = null;
    chdir.call(process, d);
  };
  if (Object.setPrototypeOf) Object.setPrototypeOf(process.chdir, chdir);
}

var polyfills$1 = patch$1;

function patch$1 (fs) {
  // (re-)implement some things that are known busted or missing.

  // lchmod, broken prior to 0.6.2
  // back-port the fix here.
  if (constants$5.hasOwnProperty('O_SYMLINK') &&
      process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
    patchLchmod(fs);
  }

  // lutimes implementation, or no-op
  if (!fs.lutimes) {
    patchLutimes(fs);
  }

  // https://github.com/isaacs/node-graceful-fs/issues/4
  // Chown should not fail on einval or eperm if non-root.
  // It should not fail on enosys ever, as this just indicates
  // that a fs doesn't support the intended operation.

  fs.chown = chownFix(fs.chown);
  fs.fchown = chownFix(fs.fchown);
  fs.lchown = chownFix(fs.lchown);

  fs.chmod = chmodFix(fs.chmod);
  fs.fchmod = chmodFix(fs.fchmod);
  fs.lchmod = chmodFix(fs.lchmod);

  fs.chownSync = chownFixSync(fs.chownSync);
  fs.fchownSync = chownFixSync(fs.fchownSync);
  fs.lchownSync = chownFixSync(fs.lchownSync);

  fs.chmodSync = chmodFixSync(fs.chmodSync);
  fs.fchmodSync = chmodFixSync(fs.fchmodSync);
  fs.lchmodSync = chmodFixSync(fs.lchmodSync);

  fs.stat = statFix(fs.stat);
  fs.fstat = statFix(fs.fstat);
  fs.lstat = statFix(fs.lstat);

  fs.statSync = statFixSync(fs.statSync);
  fs.fstatSync = statFixSync(fs.fstatSync);
  fs.lstatSync = statFixSync(fs.lstatSync);

  // if lchmod/lchown do not exist, then make them no-ops
  if (!fs.lchmod) {
    fs.lchmod = function (path, mode, cb) {
      if (cb) process.nextTick(cb);
    };
    fs.lchmodSync = function () {};
  }
  if (!fs.lchown) {
    fs.lchown = function (path, uid, gid, cb) {
      if (cb) process.nextTick(cb);
    };
    fs.lchownSync = function () {};
  }

  // on Windows, A/V software can lock the directory, causing this
  // to fail with an EACCES or EPERM if the directory contains newly
  // created files.  Try again on failure, for up to 60 seconds.

  // Set the timeout this long because some Windows Anti-Virus, such as Parity
  // bit9, may lock files for up to a minute, causing npm package install
  // failures. Also, take care to yield the scheduler. Windows scheduling gives
  // CPU to a busy looping process, which can cause the program causing the lock
  // contention to be starved of CPU by node, so the contention doesn't resolve.
  if (platform === "win32") {
    fs.rename = (function (fs$rename) { return function (from, to, cb) {
      var start = Date.now();
      var backoff = 0;
      fs$rename(from, to, function CB (er) {
        if (er
            && (er.code === "EACCES" || er.code === "EPERM")
            && Date.now() - start < 60000) {
          setTimeout(function() {
            fs.stat(to, function (stater, st) {
              if (stater && stater.code === "ENOENT")
                fs$rename(from, to, CB);
              else
                cb(er);
            });
          }, backoff);
          if (backoff < 100)
            backoff += 10;
          return;
        }
        if (cb) cb(er);
      });
    }})(fs.rename);
  }

  // if read() returns EAGAIN, then just try it again.
  fs.read = (function (fs$read) {
    function read (fd, buffer, offset, length, position, callback_) {
      var callback;
      if (callback_ && typeof callback_ === 'function') {
        var eagCounter = 0;
        callback = function (er, _, __) {
          if (er && er.code === 'EAGAIN' && eagCounter < 10) {
            eagCounter ++;
            return fs$read.call(fs, fd, buffer, offset, length, position, callback)
          }
          callback_.apply(this, arguments);
        };
      }
      return fs$read.call(fs, fd, buffer, offset, length, position, callback)
    }

    // This ensures `util.promisify` works as it does for native `fs.read`.
    if (Object.setPrototypeOf) Object.setPrototypeOf(read, fs$read);
    return read
  })(fs.read);

  fs.readSync = (function (fs$readSync) { return function (fd, buffer, offset, length, position) {
    var eagCounter = 0;
    while (true) {
      try {
        return fs$readSync.call(fs, fd, buffer, offset, length, position)
      } catch (er) {
        if (er.code === 'EAGAIN' && eagCounter < 10) {
          eagCounter ++;
          continue
        }
        throw er
      }
    }
  }})(fs.readSync);

  function patchLchmod (fs) {
    fs.lchmod = function (path, mode, callback) {
      fs.open( path
             , constants$5.O_WRONLY | constants$5.O_SYMLINK
             , mode
             , function (err, fd) {
        if (err) {
          if (callback) callback(err);
          return
        }
        // prefer to return the chmod error, if one occurs,
        // but still try to close, and report closing errors if they occur.
        fs.fchmod(fd, mode, function (err) {
          fs.close(fd, function(err2) {
            if (callback) callback(err || err2);
          });
        });
      });
    };

    fs.lchmodSync = function (path, mode) {
      var fd = fs.openSync(path, constants$5.O_WRONLY | constants$5.O_SYMLINK, mode);

      // prefer to return the chmod error, if one occurs,
      // but still try to close, and report closing errors if they occur.
      var threw = true;
      var ret;
      try {
        ret = fs.fchmodSync(fd, mode);
        threw = false;
      } finally {
        if (threw) {
          try {
            fs.closeSync(fd);
          } catch (er) {}
        } else {
          fs.closeSync(fd);
        }
      }
      return ret
    };
  }

  function patchLutimes (fs) {
    if (constants$5.hasOwnProperty("O_SYMLINK")) {
      fs.lutimes = function (path, at, mt, cb) {
        fs.open(path, constants$5.O_SYMLINK, function (er, fd) {
          if (er) {
            if (cb) cb(er);
            return
          }
          fs.futimes(fd, at, mt, function (er) {
            fs.close(fd, function (er2) {
              if (cb) cb(er || er2);
            });
          });
        });
      };

      fs.lutimesSync = function (path, at, mt) {
        var fd = fs.openSync(path, constants$5.O_SYMLINK);
        var ret;
        var threw = true;
        try {
          ret = fs.futimesSync(fd, at, mt);
          threw = false;
        } finally {
          if (threw) {
            try {
              fs.closeSync(fd);
            } catch (er) {}
          } else {
            fs.closeSync(fd);
          }
        }
        return ret
      };

    } else {
      fs.lutimes = function (_a, _b, _c, cb) { if (cb) process.nextTick(cb); };
      fs.lutimesSync = function () {};
    }
  }

  function chmodFix (orig) {
    if (!orig) return orig
    return function (target, mode, cb) {
      return orig.call(fs, target, mode, function (er) {
        if (chownErOk(er)) er = null;
        if (cb) cb.apply(this, arguments);
      })
    }
  }

  function chmodFixSync (orig) {
    if (!orig) return orig
    return function (target, mode) {
      try {
        return orig.call(fs, target, mode)
      } catch (er) {
        if (!chownErOk(er)) throw er
      }
    }
  }


  function chownFix (orig) {
    if (!orig) return orig
    return function (target, uid, gid, cb) {
      return orig.call(fs, target, uid, gid, function (er) {
        if (chownErOk(er)) er = null;
        if (cb) cb.apply(this, arguments);
      })
    }
  }

  function chownFixSync (orig) {
    if (!orig) return orig
    return function (target, uid, gid) {
      try {
        return orig.call(fs, target, uid, gid)
      } catch (er) {
        if (!chownErOk(er)) throw er
      }
    }
  }

  function statFix (orig) {
    if (!orig) return orig
    // Older versions of Node erroneously returned signed integers for
    // uid + gid.
    return function (target, options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = null;
      }
      function callback (er, stats) {
        if (stats) {
          if (stats.uid < 0) stats.uid += 0x100000000;
          if (stats.gid < 0) stats.gid += 0x100000000;
        }
        if (cb) cb.apply(this, arguments);
      }
      return options ? orig.call(fs, target, options, callback)
        : orig.call(fs, target, callback)
    }
  }

  function statFixSync (orig) {
    if (!orig) return orig
    // Older versions of Node erroneously returned signed integers for
    // uid + gid.
    return function (target, options) {
      var stats = options ? orig.call(fs, target, options)
        : orig.call(fs, target);
      if (stats) {
        if (stats.uid < 0) stats.uid += 0x100000000;
        if (stats.gid < 0) stats.gid += 0x100000000;
      }
      return stats;
    }
  }

  // ENOSYS means that the fs doesn't support the op. Just ignore
  // that, because it doesn't matter.
  //
  // if there's no getuid, or if getuid() is something other
  // than 0, and the error is EINVAL or EPERM, then just ignore
  // it.
  //
  // This specific case is a silent failure in cp, install, tar,
  // and most other unix tools that manage permissions.
  //
  // When running as root, or if other types of errors are
  // encountered, then it's strict.
  function chownErOk (er) {
    if (!er)
      return true

    if (er.code === "ENOSYS")
      return true

    var nonroot = !process.getuid || process.getuid() !== 0;
    if (nonroot) {
      if (er.code === "EINVAL" || er.code === "EPERM")
        return true
    }

    return false
  }
}

var Stream$1 = require$$0$1.Stream;

var legacyStreams = legacy$1;

function legacy$1 (fs) {
  return {
    ReadStream: ReadStream,
    WriteStream: WriteStream
  }

  function ReadStream (path, options) {
    if (!(this instanceof ReadStream)) return new ReadStream(path, options);

    Stream$1.call(this);

    var self = this;

    this.path = path;
    this.fd = null;
    this.readable = true;
    this.paused = false;

    this.flags = 'r';
    this.mode = 438; /*=0666*/
    this.bufferSize = 64 * 1024;

    options = options || {};

    // Mixin options into this
    var keys = Object.keys(options);
    for (var index = 0, length = keys.length; index < length; index++) {
      var key = keys[index];
      this[key] = options[key];
    }

    if (this.encoding) this.setEncoding(this.encoding);

    if (this.start !== undefined) {
      if ('number' !== typeof this.start) {
        throw TypeError('start must be a Number');
      }
      if (this.end === undefined) {
        this.end = Infinity;
      } else if ('number' !== typeof this.end) {
        throw TypeError('end must be a Number');
      }

      if (this.start > this.end) {
        throw new Error('start must be <= end');
      }

      this.pos = this.start;
    }

    if (this.fd !== null) {
      process.nextTick(function() {
        self._read();
      });
      return;
    }

    fs.open(this.path, this.flags, this.mode, function (err, fd) {
      if (err) {
        self.emit('error', err);
        self.readable = false;
        return;
      }

      self.fd = fd;
      self.emit('open', fd);
      self._read();
    });
  }

  function WriteStream (path, options) {
    if (!(this instanceof WriteStream)) return new WriteStream(path, options);

    Stream$1.call(this);

    this.path = path;
    this.fd = null;
    this.writable = true;

    this.flags = 'w';
    this.encoding = 'binary';
    this.mode = 438; /*=0666*/
    this.bytesWritten = 0;

    options = options || {};

    // Mixin options into this
    var keys = Object.keys(options);
    for (var index = 0, length = keys.length; index < length; index++) {
      var key = keys[index];
      this[key] = options[key];
    }

    if (this.start !== undefined) {
      if ('number' !== typeof this.start) {
        throw TypeError('start must be a Number');
      }
      if (this.start < 0) {
        throw new Error('start must be >= zero');
      }

      this.pos = this.start;
    }

    this.busy = false;
    this._queue = [];

    if (this.fd === null) {
      this._open = fs.open;
      this._queue.push([this._open, this.path, this.flags, this.mode, undefined]);
      this.flush();
    }
  }
}

var clone_1 = clone$1;

var getPrototypeOf = Object.getPrototypeOf || function (obj) {
  return obj.__proto__
};

function clone$1 (obj) {
  if (obj === null || typeof obj !== 'object')
    return obj

  if (obj instanceof Object)
    var copy = { __proto__: getPrototypeOf(obj) };
  else
    var copy = Object.create(null);

  Object.getOwnPropertyNames(obj).forEach(function (key) {
    Object.defineProperty(copy, key, Object.getOwnPropertyDescriptor(obj, key));
  });

  return copy
}

var fs$q = require$$0$2;
var polyfills = polyfills$1;
var legacy = legacyStreams;
var clone = clone_1;

var util$3 = require$$0$3;

/* istanbul ignore next - node 0.x polyfill */
var gracefulQueue;
var previousSymbol;

/* istanbul ignore else - node 0.x polyfill */
if (typeof Symbol === 'function' && typeof Symbol.for === 'function') {
  gracefulQueue = Symbol.for('graceful-fs.queue');
  // This is used in testing by future versions
  previousSymbol = Symbol.for('graceful-fs.previous');
} else {
  gracefulQueue = '___graceful-fs.queue';
  previousSymbol = '___graceful-fs.previous';
}

function noop$1 () {}

function publishQueue(context, queue) {
  Object.defineProperty(context, gracefulQueue, {
    get: function() {
      return queue
    }
  });
}

var debug = noop$1;
if (util$3.debuglog)
  debug = util$3.debuglog('gfs4');
else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || ''))
  debug = function() {
    var m = util$3.format.apply(util$3, arguments);
    m = 'GFS4: ' + m.split(/\n/).join('\nGFS4: ');
    console.error(m);
  };

// Once time initialization
if (!fs$q[gracefulQueue]) {
  // This queue can be shared by multiple loaded instances
  var queue$1 = commonjsGlobal[gracefulQueue] || [];
  publishQueue(fs$q, queue$1);

  // Patch fs.close/closeSync to shared queue version, because we need
  // to retry() whenever a close happens *anywhere* in the program.
  // This is essential when multiple graceful-fs instances are
  // in play at the same time.
  fs$q.close = (function (fs$close) {
    function close (fd, cb) {
      return fs$close.call(fs$q, fd, function (err) {
        // This function uses the graceful-fs shared queue
        if (!err) {
          resetQueue();
        }

        if (typeof cb === 'function')
          cb.apply(this, arguments);
      })
    }

    Object.defineProperty(close, previousSymbol, {
      value: fs$close
    });
    return close
  })(fs$q.close);

  fs$q.closeSync = (function (fs$closeSync) {
    function closeSync (fd) {
      // This function uses the graceful-fs shared queue
      fs$closeSync.apply(fs$q, arguments);
      resetQueue();
    }

    Object.defineProperty(closeSync, previousSymbol, {
      value: fs$closeSync
    });
    return closeSync
  })(fs$q.closeSync);

  if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || '')) {
    process.on('exit', function() {
      debug(fs$q[gracefulQueue]);
      require$$5.equal(fs$q[gracefulQueue].length, 0);
    });
  }
}

if (!commonjsGlobal[gracefulQueue]) {
  publishQueue(commonjsGlobal, fs$q[gracefulQueue]);
}

var gracefulFs = patch(clone(fs$q));
if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !fs$q.__patched) {
    gracefulFs = patch(fs$q);
    fs$q.__patched = true;
}

function patch (fs) {
  // Everything that references the open() function needs to be in here
  polyfills(fs);
  fs.gracefulify = patch;

  fs.createReadStream = createReadStream;
  fs.createWriteStream = createWriteStream;
  var fs$readFile = fs.readFile;
  fs.readFile = readFile;
  function readFile (path, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null;

    return go$readFile(path, options, cb)

    function go$readFile (path, options, cb, startTime) {
      return fs$readFile(path, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$readFile, [path, options, cb], err, startTime || Date.now(), Date.now()]);
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments);
        }
      })
    }
  }

  var fs$writeFile = fs.writeFile;
  fs.writeFile = writeFile;
  function writeFile (path, data, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null;

    return go$writeFile(path, data, options, cb)

    function go$writeFile (path, data, options, cb, startTime) {
      return fs$writeFile(path, data, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$writeFile, [path, data, options, cb], err, startTime || Date.now(), Date.now()]);
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments);
        }
      })
    }
  }

  var fs$appendFile = fs.appendFile;
  if (fs$appendFile)
    fs.appendFile = appendFile;
  function appendFile (path, data, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null;

    return go$appendFile(path, data, options, cb)

    function go$appendFile (path, data, options, cb, startTime) {
      return fs$appendFile(path, data, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$appendFile, [path, data, options, cb], err, startTime || Date.now(), Date.now()]);
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments);
        }
      })
    }
  }

  var fs$copyFile = fs.copyFile;
  if (fs$copyFile)
    fs.copyFile = copyFile;
  function copyFile (src, dest, flags, cb) {
    if (typeof flags === 'function') {
      cb = flags;
      flags = 0;
    }
    return go$copyFile(src, dest, flags, cb)

    function go$copyFile (src, dest, flags, cb, startTime) {
      return fs$copyFile(src, dest, flags, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$copyFile, [src, dest, flags, cb], err, startTime || Date.now(), Date.now()]);
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments);
        }
      })
    }
  }

  var fs$readdir = fs.readdir;
  fs.readdir = readdir;
  function readdir (path, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null;

    return go$readdir(path, options, cb)

    function go$readdir (path, options, cb, startTime) {
      return fs$readdir(path, options, function (err, files) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$readdir, [path, options, cb], err, startTime || Date.now(), Date.now()]);
        else {
          if (files && files.sort)
            files.sort();

          if (typeof cb === 'function')
            cb.call(this, err, files);
        }
      })
    }
  }

  if (process.version.substr(0, 4) === 'v0.8') {
    var legStreams = legacy(fs);
    ReadStream = legStreams.ReadStream;
    WriteStream = legStreams.WriteStream;
  }

  var fs$ReadStream = fs.ReadStream;
  if (fs$ReadStream) {
    ReadStream.prototype = Object.create(fs$ReadStream.prototype);
    ReadStream.prototype.open = ReadStream$open;
  }

  var fs$WriteStream = fs.WriteStream;
  if (fs$WriteStream) {
    WriteStream.prototype = Object.create(fs$WriteStream.prototype);
    WriteStream.prototype.open = WriteStream$open;
  }

  Object.defineProperty(fs, 'ReadStream', {
    get: function () {
      return ReadStream
    },
    set: function (val) {
      ReadStream = val;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(fs, 'WriteStream', {
    get: function () {
      return WriteStream
    },
    set: function (val) {
      WriteStream = val;
    },
    enumerable: true,
    configurable: true
  });

  // legacy names
  var FileReadStream = ReadStream;
  Object.defineProperty(fs, 'FileReadStream', {
    get: function () {
      return FileReadStream
    },
    set: function (val) {
      FileReadStream = val;
    },
    enumerable: true,
    configurable: true
  });
  var FileWriteStream = WriteStream;
  Object.defineProperty(fs, 'FileWriteStream', {
    get: function () {
      return FileWriteStream
    },
    set: function (val) {
      FileWriteStream = val;
    },
    enumerable: true,
    configurable: true
  });

  function ReadStream (path, options) {
    if (this instanceof ReadStream)
      return fs$ReadStream.apply(this, arguments), this
    else
      return ReadStream.apply(Object.create(ReadStream.prototype), arguments)
  }

  function ReadStream$open () {
    var that = this;
    open(that.path, that.flags, that.mode, function (err, fd) {
      if (err) {
        if (that.autoClose)
          that.destroy();

        that.emit('error', err);
      } else {
        that.fd = fd;
        that.emit('open', fd);
        that.read();
      }
    });
  }

  function WriteStream (path, options) {
    if (this instanceof WriteStream)
      return fs$WriteStream.apply(this, arguments), this
    else
      return WriteStream.apply(Object.create(WriteStream.prototype), arguments)
  }

  function WriteStream$open () {
    var that = this;
    open(that.path, that.flags, that.mode, function (err, fd) {
      if (err) {
        that.destroy();
        that.emit('error', err);
      } else {
        that.fd = fd;
        that.emit('open', fd);
      }
    });
  }

  function createReadStream (path, options) {
    return new fs.ReadStream(path, options)
  }

  function createWriteStream (path, options) {
    return new fs.WriteStream(path, options)
  }

  var fs$open = fs.open;
  fs.open = open;
  function open (path, flags, mode, cb) {
    if (typeof mode === 'function')
      cb = mode, mode = null;

    return go$open(path, flags, mode, cb)

    function go$open (path, flags, mode, cb, startTime) {
      return fs$open(path, flags, mode, function (err, fd) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$open, [path, flags, mode, cb], err, startTime || Date.now(), Date.now()]);
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments);
        }
      })
    }
  }

  return fs
}

function enqueue (elem) {
  debug('ENQUEUE', elem[0].name, elem[1]);
  fs$q[gracefulQueue].push(elem);
  retry();
}

// keep track of the timeout between retry() calls
var retryTimer;

// reset the startTime and lastTime to now
// this resets the start of the 60 second overall timeout as well as the
// delay between attempts so that we'll retry these jobs sooner
function resetQueue () {
  var now = Date.now();
  for (var i = 0; i < fs$q[gracefulQueue].length; ++i) {
    // entries that are only a length of 2 are from an older version, don't
    // bother modifying those since they'll be retried anyway.
    if (fs$q[gracefulQueue][i].length > 2) {
      fs$q[gracefulQueue][i][3] = now; // startTime
      fs$q[gracefulQueue][i][4] = now; // lastTime
    }
  }
  // call retry to make sure we're actively processing the queue
  retry();
}

function retry () {
  // clear the timer and remove it to help prevent unintended concurrency
  clearTimeout(retryTimer);
  retryTimer = undefined;

  if (fs$q[gracefulQueue].length === 0)
    return

  var elem = fs$q[gracefulQueue].shift();
  var fn = elem[0];
  var args = elem[1];
  // these items may be unset if they were added by an older graceful-fs
  var err = elem[2];
  var startTime = elem[3];
  var lastTime = elem[4];

  // if we don't have a startTime we have no way of knowing if we've waited
  // long enough, so go ahead and retry this item now
  if (startTime === undefined) {
    debug('RETRY', fn.name, args);
    fn.apply(null, args);
  } else if (Date.now() - startTime >= 60000) {
    // it's been more than 60 seconds total, bail now
    debug('TIMEOUT', fn.name, args);
    var cb = args.pop();
    if (typeof cb === 'function')
      cb.call(null, err);
  } else {
    // the amount of time between the last attempt and right now
    var sinceAttempt = Date.now() - lastTime;
    // the amount of time between when we first tried, and when we last tried
    // rounded up to at least 1
    var sinceStart = Math.max(lastTime - startTime, 1);
    // backoff. wait longer than the total time we've been retrying, but only
    // up to a maximum of 100ms
    var desiredDelay = Math.min(sinceStart * 1.2, 100);
    // it's been long enough since the last retry, do it again
    if (sinceAttempt >= desiredDelay) {
      debug('RETRY', fn.name, args);
      fn.apply(null, args.concat([startTime]));
    } else {
      // if we can't do this job yet, push it to the end of the queue
      // and let the next iteration check again
      fs$q[gracefulQueue].push(elem);
    }
  }

  // schedule our next run if one isn't already scheduled
  if (retryTimer === undefined) {
    retryTimer = setTimeout(retry, 0);
  }
}

(function (exports) {
// This is adapted from https://github.com/normalize/mz
// Copyright (c) 2014-2016 Jonathan Ong me@jongleberry.com and Contributors
const u = universalify$1.fromCallback;
const fs = gracefulFs;

const api = [
  'access',
  'appendFile',
  'chmod',
  'chown',
  'close',
  'copyFile',
  'fchmod',
  'fchown',
  'fdatasync',
  'fstat',
  'fsync',
  'ftruncate',
  'futimes',
  'lchmod',
  'lchown',
  'link',
  'lstat',
  'mkdir',
  'mkdtemp',
  'open',
  'opendir',
  'readdir',
  'readFile',
  'readlink',
  'realpath',
  'rename',
  'rm',
  'rmdir',
  'stat',
  'symlink',
  'truncate',
  'unlink',
  'utimes',
  'writeFile'
].filter(key => {
  // Some commands are not available on some systems. Ex:
  // fs.opendir was added in Node.js v12.12.0
  // fs.rm was added in Node.js v14.14.0
  // fs.lchown is not available on at least some Linux
  return typeof fs[key] === 'function'
});

// Export cloned fs:
Object.assign(exports, fs);

// Universalify async methods:
api.forEach(method => {
  exports[method] = u(fs[method]);
});

// We differ from mz/fs in that we still ship the old, broken, fs.exists()
// since we are a drop-in replacement for the native module
exports.exists = function (filename, callback) {
  if (typeof callback === 'function') {
    return fs.exists(filename, callback)
  }
  return new Promise(resolve => {
    return fs.exists(filename, resolve)
  })
};

// fs.read(), fs.write(), & fs.writev() need special treatment due to multiple callback args

exports.read = function (fd, buffer, offset, length, position, callback) {
  if (typeof callback === 'function') {
    return fs.read(fd, buffer, offset, length, position, callback)
  }
  return new Promise((resolve, reject) => {
    fs.read(fd, buffer, offset, length, position, (err, bytesRead, buffer) => {
      if (err) return reject(err)
      resolve({ bytesRead, buffer });
    });
  })
};

// Function signature can be
// fs.write(fd, buffer[, offset[, length[, position]]], callback)
// OR
// fs.write(fd, string[, position[, encoding]], callback)
// We need to handle both cases, so we use ...args
exports.write = function (fd, buffer, ...args) {
  if (typeof args[args.length - 1] === 'function') {
    return fs.write(fd, buffer, ...args)
  }

  return new Promise((resolve, reject) => {
    fs.write(fd, buffer, ...args, (err, bytesWritten, buffer) => {
      if (err) return reject(err)
      resolve({ bytesWritten, buffer });
    });
  })
};

// fs.writev only available in Node v12.9.0+
if (typeof fs.writev === 'function') {
  // Function signature is
  // s.writev(fd, buffers[, position], callback)
  // We need to handle the optional arg, so we use ...args
  exports.writev = function (fd, buffers, ...args) {
    if (typeof args[args.length - 1] === 'function') {
      return fs.writev(fd, buffers, ...args)
    }

    return new Promise((resolve, reject) => {
      fs.writev(fd, buffers, ...args, (err, bytesWritten, buffers) => {
        if (err) return reject(err)
        resolve({ bytesWritten, buffers });
      });
    })
  };
}

// fs.realpath.native sometimes not available if fs is monkey-patched
if (typeof fs.realpath.native === 'function') {
  exports.realpath.native = u(fs.realpath.native);
} else {
  process.emitWarning(
    'fs.realpath.native is not a function. Is fs being monkey-patched?',
    'Warning', 'fs-extra-WARN0003'
  );
}
}(fs$r));

var makeDir$1 = {};

var utils$m = {};

const path$n = require$$0$4;

// https://github.com/nodejs/node/issues/8987
// https://github.com/libuv/libuv/pull/1088
utils$m.checkPath = function checkPath (pth) {
  if (process.platform === 'win32') {
    const pathHasInvalidWinCharacters = /[<>:"|?*]/.test(pth.replace(path$n.parse(pth).root, ''));

    if (pathHasInvalidWinCharacters) {
      const error = new Error(`Path contains invalid characters: ${pth}`);
      error.code = 'EINVAL';
      throw error
    }
  }
};

const fs$p = fs$r;
const { checkPath: checkPath$1 } = utils$m;

const getMode = options => {
  const defaults = { mode: 0o777 };
  if (typeof options === 'number') return options
  return ({ ...defaults, ...options }).mode
};

makeDir$1.makeDir = async (dir, options) => {
  checkPath$1(dir);

  return fs$p.mkdir(dir, {
    mode: getMode(options),
    recursive: true
  })
};

makeDir$1.makeDirSync = (dir, options) => {
  checkPath$1(dir);

  return fs$p.mkdirSync(dir, {
    mode: getMode(options),
    recursive: true
  })
};

const u$a = universalify$1.fromPromise;
const { makeDir: _makeDir, makeDirSync } = makeDir$1;
const makeDir = u$a(_makeDir);

var mkdirs$2 = {
  mkdirs: makeDir,
  mkdirsSync: makeDirSync,
  // alias
  mkdirp: makeDir,
  mkdirpSync: makeDirSync,
  ensureDir: makeDir,
  ensureDirSync: makeDirSync
};

const u$9 = universalify$1.fromPromise;
const fs$o = fs$r;

function pathExists$6 (path) {
  return fs$o.access(path).then(() => true).catch(() => false)
}

var pathExists_1 = {
  pathExists: u$9(pathExists$6),
  pathExistsSync: fs$o.existsSync
};

const fs$n = gracefulFs;

function utimesMillis$1 (path, atime, mtime, callback) {
  // if (!HAS_MILLIS_RES) return fs.utimes(path, atime, mtime, callback)
  fs$n.open(path, 'r+', (err, fd) => {
    if (err) return callback(err)
    fs$n.futimes(fd, atime, mtime, futimesErr => {
      fs$n.close(fd, closeErr => {
        if (callback) callback(futimesErr || closeErr);
      });
    });
  });
}

function utimesMillisSync$1 (path, atime, mtime) {
  const fd = fs$n.openSync(path, 'r+');
  fs$n.futimesSync(fd, atime, mtime);
  return fs$n.closeSync(fd)
}

var utimes = {
  utimesMillis: utimesMillis$1,
  utimesMillisSync: utimesMillisSync$1
};

const fs$m = fs$r;
const path$m = require$$0$4;
const util$2 = require$$0$3;

function getStats$2 (src, dest, opts) {
  const statFunc = opts.dereference
    ? (file) => fs$m.stat(file, { bigint: true })
    : (file) => fs$m.lstat(file, { bigint: true });
  return Promise.all([
    statFunc(src),
    statFunc(dest).catch(err => {
      if (err.code === 'ENOENT') return null
      throw err
    })
  ]).then(([srcStat, destStat]) => ({ srcStat, destStat }))
}

function getStatsSync (src, dest, opts) {
  let destStat;
  const statFunc = opts.dereference
    ? (file) => fs$m.statSync(file, { bigint: true })
    : (file) => fs$m.lstatSync(file, { bigint: true });
  const srcStat = statFunc(src);
  try {
    destStat = statFunc(dest);
  } catch (err) {
    if (err.code === 'ENOENT') return { srcStat, destStat: null }
    throw err
  }
  return { srcStat, destStat }
}

function checkPaths (src, dest, funcName, opts, cb) {
  util$2.callbackify(getStats$2)(src, dest, opts, (err, stats) => {
    if (err) return cb(err)
    const { srcStat, destStat } = stats;

    if (destStat) {
      if (areIdentical$2(srcStat, destStat)) {
        const srcBaseName = path$m.basename(src);
        const destBaseName = path$m.basename(dest);
        if (funcName === 'move' &&
          srcBaseName !== destBaseName &&
          srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
          return cb(null, { srcStat, destStat, isChangingCase: true })
        }
        return cb(new Error('Source and destination must not be the same.'))
      }
      if (srcStat.isDirectory() && !destStat.isDirectory()) {
        return cb(new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`))
      }
      if (!srcStat.isDirectory() && destStat.isDirectory()) {
        return cb(new Error(`Cannot overwrite directory '${dest}' with non-directory '${src}'.`))
      }
    }

    if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
      return cb(new Error(errMsg(src, dest, funcName)))
    }
    return cb(null, { srcStat, destStat })
  });
}

function checkPathsSync (src, dest, funcName, opts) {
  const { srcStat, destStat } = getStatsSync(src, dest, opts);

  if (destStat) {
    if (areIdentical$2(srcStat, destStat)) {
      const srcBaseName = path$m.basename(src);
      const destBaseName = path$m.basename(dest);
      if (funcName === 'move' &&
        srcBaseName !== destBaseName &&
        srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
        return { srcStat, destStat, isChangingCase: true }
      }
      throw new Error('Source and destination must not be the same.')
    }
    if (srcStat.isDirectory() && !destStat.isDirectory()) {
      throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`)
    }
    if (!srcStat.isDirectory() && destStat.isDirectory()) {
      throw new Error(`Cannot overwrite directory '${dest}' with non-directory '${src}'.`)
    }
  }

  if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
    throw new Error(errMsg(src, dest, funcName))
  }
  return { srcStat, destStat }
}

// recursively check if dest parent is a subdirectory of src.
// It works for all file types including symlinks since it
// checks the src and dest inodes. It starts from the deepest
// parent and stops once it reaches the src parent or the root path.
function checkParentPaths (src, srcStat, dest, funcName, cb) {
  const srcParent = path$m.resolve(path$m.dirname(src));
  const destParent = path$m.resolve(path$m.dirname(dest));
  if (destParent === srcParent || destParent === path$m.parse(destParent).root) return cb()
  fs$m.stat(destParent, { bigint: true }, (err, destStat) => {
    if (err) {
      if (err.code === 'ENOENT') return cb()
      return cb(err)
    }
    if (areIdentical$2(srcStat, destStat)) {
      return cb(new Error(errMsg(src, dest, funcName)))
    }
    return checkParentPaths(src, srcStat, destParent, funcName, cb)
  });
}

function checkParentPathsSync (src, srcStat, dest, funcName) {
  const srcParent = path$m.resolve(path$m.dirname(src));
  const destParent = path$m.resolve(path$m.dirname(dest));
  if (destParent === srcParent || destParent === path$m.parse(destParent).root) return
  let destStat;
  try {
    destStat = fs$m.statSync(destParent, { bigint: true });
  } catch (err) {
    if (err.code === 'ENOENT') return
    throw err
  }
  if (areIdentical$2(srcStat, destStat)) {
    throw new Error(errMsg(src, dest, funcName))
  }
  return checkParentPathsSync(src, srcStat, destParent, funcName)
}

function areIdentical$2 (srcStat, destStat) {
  return destStat.ino && destStat.dev && destStat.ino === srcStat.ino && destStat.dev === srcStat.dev
}

// return true if dest is a subdir of src, otherwise false.
// It only checks the path strings.
function isSrcSubdir (src, dest) {
  const srcArr = path$m.resolve(src).split(path$m.sep).filter(i => i);
  const destArr = path$m.resolve(dest).split(path$m.sep).filter(i => i);
  return srcArr.reduce((acc, cur, i) => acc && destArr[i] === cur, true)
}

function errMsg (src, dest, funcName) {
  return `Cannot ${funcName} '${src}' to a subdirectory of itself, '${dest}'.`
}

var stat$5 = {
  checkPaths,
  checkPathsSync,
  checkParentPaths,
  checkParentPathsSync,
  isSrcSubdir,
  areIdentical: areIdentical$2
};

const fs$l = gracefulFs;
const path$l = require$$0$4;
const mkdirs$1 = mkdirs$2.mkdirs;
const pathExists$5 = pathExists_1.pathExists;
const utimesMillis = utimes.utimesMillis;
const stat$4 = stat$5;

function copy$2 (src, dest, opts, cb) {
  if (typeof opts === 'function' && !cb) {
    cb = opts;
    opts = {};
  } else if (typeof opts === 'function') {
    opts = { filter: opts };
  }

  cb = cb || function () {};
  opts = opts || {};

  opts.clobber = 'clobber' in opts ? !!opts.clobber : true; // default to true for now
  opts.overwrite = 'overwrite' in opts ? !!opts.overwrite : opts.clobber; // overwrite falls back to clobber

  // Warn about using preserveTimestamps on 32-bit node
  if (opts.preserveTimestamps && process.arch === 'ia32') {
    process.emitWarning(
      'Using the preserveTimestamps option in 32-bit node is not recommended;\n\n' +
      '\tsee https://github.com/jprichardson/node-fs-extra/issues/269',
      'Warning', 'fs-extra-WARN0001'
    );
  }

  stat$4.checkPaths(src, dest, 'copy', opts, (err, stats) => {
    if (err) return cb(err)
    const { srcStat, destStat } = stats;
    stat$4.checkParentPaths(src, srcStat, dest, 'copy', err => {
      if (err) return cb(err)
      if (opts.filter) return handleFilter(checkParentDir, destStat, src, dest, opts, cb)
      return checkParentDir(destStat, src, dest, opts, cb)
    });
  });
}

function checkParentDir (destStat, src, dest, opts, cb) {
  const destParent = path$l.dirname(dest);
  pathExists$5(destParent, (err, dirExists) => {
    if (err) return cb(err)
    if (dirExists) return getStats$1(destStat, src, dest, opts, cb)
    mkdirs$1(destParent, err => {
      if (err) return cb(err)
      return getStats$1(destStat, src, dest, opts, cb)
    });
  });
}

function handleFilter (onInclude, destStat, src, dest, opts, cb) {
  Promise.resolve(opts.filter(src, dest)).then(include => {
    if (include) return onInclude(destStat, src, dest, opts, cb)
    return cb()
  }, error => cb(error));
}

function startCopy$1 (destStat, src, dest, opts, cb) {
  if (opts.filter) return handleFilter(getStats$1, destStat, src, dest, opts, cb)
  return getStats$1(destStat, src, dest, opts, cb)
}

function getStats$1 (destStat, src, dest, opts, cb) {
  const stat = opts.dereference ? fs$l.stat : fs$l.lstat;
  stat(src, (err, srcStat) => {
    if (err) return cb(err)

    if (srcStat.isDirectory()) return onDir$1(srcStat, destStat, src, dest, opts, cb)
    else if (srcStat.isFile() ||
             srcStat.isCharacterDevice() ||
             srcStat.isBlockDevice()) return onFile$1(srcStat, destStat, src, dest, opts, cb)
    else if (srcStat.isSymbolicLink()) return onLink$1(destStat, src, dest, opts, cb)
    else if (srcStat.isSocket()) return cb(new Error(`Cannot copy a socket file: ${src}`))
    else if (srcStat.isFIFO()) return cb(new Error(`Cannot copy a FIFO pipe: ${src}`))
    return cb(new Error(`Unknown file: ${src}`))
  });
}

function onFile$1 (srcStat, destStat, src, dest, opts, cb) {
  if (!destStat) return copyFile$1(srcStat, src, dest, opts, cb)
  return mayCopyFile$1(srcStat, src, dest, opts, cb)
}

function mayCopyFile$1 (srcStat, src, dest, opts, cb) {
  if (opts.overwrite) {
    fs$l.unlink(dest, err => {
      if (err) return cb(err)
      return copyFile$1(srcStat, src, dest, opts, cb)
    });
  } else if (opts.errorOnExist) {
    return cb(new Error(`'${dest}' already exists`))
  } else return cb()
}

function copyFile$1 (srcStat, src, dest, opts, cb) {
  fs$l.copyFile(src, dest, err => {
    if (err) return cb(err)
    if (opts.preserveTimestamps) return handleTimestampsAndMode(srcStat.mode, src, dest, cb)
    return setDestMode$1(dest, srcStat.mode, cb)
  });
}

function handleTimestampsAndMode (srcMode, src, dest, cb) {
  // Make sure the file is writable before setting the timestamp
  // otherwise open fails with EPERM when invoked with 'r+'
  // (through utimes call)
  if (fileIsNotWritable$1(srcMode)) {
    return makeFileWritable$1(dest, srcMode, err => {
      if (err) return cb(err)
      return setDestTimestampsAndMode(srcMode, src, dest, cb)
    })
  }
  return setDestTimestampsAndMode(srcMode, src, dest, cb)
}

function fileIsNotWritable$1 (srcMode) {
  return (srcMode & 0o200) === 0
}

function makeFileWritable$1 (dest, srcMode, cb) {
  return setDestMode$1(dest, srcMode | 0o200, cb)
}

function setDestTimestampsAndMode (srcMode, src, dest, cb) {
  setDestTimestamps$1(src, dest, err => {
    if (err) return cb(err)
    return setDestMode$1(dest, srcMode, cb)
  });
}

function setDestMode$1 (dest, srcMode, cb) {
  return fs$l.chmod(dest, srcMode, cb)
}

function setDestTimestamps$1 (src, dest, cb) {
  // The initial srcStat.atime cannot be trusted
  // because it is modified by the read(2) system call
  // (See https://nodejs.org/api/fs.html#fs_stat_time_values)
  fs$l.stat(src, (err, updatedSrcStat) => {
    if (err) return cb(err)
    return utimesMillis(dest, updatedSrcStat.atime, updatedSrcStat.mtime, cb)
  });
}

function onDir$1 (srcStat, destStat, src, dest, opts, cb) {
  if (!destStat) return mkDirAndCopy$1(srcStat.mode, src, dest, opts, cb)
  return copyDir$1(src, dest, opts, cb)
}

function mkDirAndCopy$1 (srcMode, src, dest, opts, cb) {
  fs$l.mkdir(dest, err => {
    if (err) return cb(err)
    copyDir$1(src, dest, opts, err => {
      if (err) return cb(err)
      return setDestMode$1(dest, srcMode, cb)
    });
  });
}

function copyDir$1 (src, dest, opts, cb) {
  fs$l.readdir(src, (err, items) => {
    if (err) return cb(err)
    return copyDirItems(items, src, dest, opts, cb)
  });
}

function copyDirItems (items, src, dest, opts, cb) {
  const item = items.pop();
  if (!item) return cb()
  return copyDirItem$1(items, item, src, dest, opts, cb)
}

function copyDirItem$1 (items, item, src, dest, opts, cb) {
  const srcItem = path$l.join(src, item);
  const destItem = path$l.join(dest, item);
  stat$4.checkPaths(srcItem, destItem, 'copy', opts, (err, stats) => {
    if (err) return cb(err)
    const { destStat } = stats;
    startCopy$1(destStat, srcItem, destItem, opts, err => {
      if (err) return cb(err)
      return copyDirItems(items, src, dest, opts, cb)
    });
  });
}

function onLink$1 (destStat, src, dest, opts, cb) {
  fs$l.readlink(src, (err, resolvedSrc) => {
    if (err) return cb(err)
    if (opts.dereference) {
      resolvedSrc = path$l.resolve(process.cwd(), resolvedSrc);
    }

    if (!destStat) {
      return fs$l.symlink(resolvedSrc, dest, cb)
    } else {
      fs$l.readlink(dest, (err, resolvedDest) => {
        if (err) {
          // dest exists and is a regular file or directory,
          // Windows may throw UNKNOWN error. If dest already exists,
          // fs throws error anyway, so no need to guard against it here.
          if (err.code === 'EINVAL' || err.code === 'UNKNOWN') return fs$l.symlink(resolvedSrc, dest, cb)
          return cb(err)
        }
        if (opts.dereference) {
          resolvedDest = path$l.resolve(process.cwd(), resolvedDest);
        }
        if (stat$4.isSrcSubdir(resolvedSrc, resolvedDest)) {
          return cb(new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`))
        }

        // do not copy if src is a subdir of dest since unlinking
        // dest in this case would result in removing src contents
        // and therefore a broken symlink would be created.
        if (destStat.isDirectory() && stat$4.isSrcSubdir(resolvedDest, resolvedSrc)) {
          return cb(new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`))
        }
        return copyLink$1(resolvedSrc, dest, cb)
      });
    }
  });
}

function copyLink$1 (resolvedSrc, dest, cb) {
  fs$l.unlink(dest, err => {
    if (err) return cb(err)
    return fs$l.symlink(resolvedSrc, dest, cb)
  });
}

var copy_1 = copy$2;

const fs$k = gracefulFs;
const path$k = require$$0$4;
const mkdirsSync$1 = mkdirs$2.mkdirsSync;
const utimesMillisSync = utimes.utimesMillisSync;
const stat$3 = stat$5;

function copySync$1 (src, dest, opts) {
  if (typeof opts === 'function') {
    opts = { filter: opts };
  }

  opts = opts || {};
  opts.clobber = 'clobber' in opts ? !!opts.clobber : true; // default to true for now
  opts.overwrite = 'overwrite' in opts ? !!opts.overwrite : opts.clobber; // overwrite falls back to clobber

  // Warn about using preserveTimestamps on 32-bit node
  if (opts.preserveTimestamps && process.arch === 'ia32') {
    process.emitWarning(
      'Using the preserveTimestamps option in 32-bit node is not recommended;\n\n' +
      '\tsee https://github.com/jprichardson/node-fs-extra/issues/269',
      'Warning', 'fs-extra-WARN0002'
    );
  }

  const { srcStat, destStat } = stat$3.checkPathsSync(src, dest, 'copy', opts);
  stat$3.checkParentPathsSync(src, srcStat, dest, 'copy');
  return handleFilterAndCopy(destStat, src, dest, opts)
}

function handleFilterAndCopy (destStat, src, dest, opts) {
  if (opts.filter && !opts.filter(src, dest)) return
  const destParent = path$k.dirname(dest);
  if (!fs$k.existsSync(destParent)) mkdirsSync$1(destParent);
  return getStats(destStat, src, dest, opts)
}

function startCopy (destStat, src, dest, opts) {
  if (opts.filter && !opts.filter(src, dest)) return
  return getStats(destStat, src, dest, opts)
}

function getStats (destStat, src, dest, opts) {
  const statSync = opts.dereference ? fs$k.statSync : fs$k.lstatSync;
  const srcStat = statSync(src);

  if (srcStat.isDirectory()) return onDir(srcStat, destStat, src, dest, opts)
  else if (srcStat.isFile() ||
           srcStat.isCharacterDevice() ||
           srcStat.isBlockDevice()) return onFile(srcStat, destStat, src, dest, opts)
  else if (srcStat.isSymbolicLink()) return onLink(destStat, src, dest, opts)
  else if (srcStat.isSocket()) throw new Error(`Cannot copy a socket file: ${src}`)
  else if (srcStat.isFIFO()) throw new Error(`Cannot copy a FIFO pipe: ${src}`)
  throw new Error(`Unknown file: ${src}`)
}

function onFile (srcStat, destStat, src, dest, opts) {
  if (!destStat) return copyFile(srcStat, src, dest, opts)
  return mayCopyFile(srcStat, src, dest, opts)
}

function mayCopyFile (srcStat, src, dest, opts) {
  if (opts.overwrite) {
    fs$k.unlinkSync(dest);
    return copyFile(srcStat, src, dest, opts)
  } else if (opts.errorOnExist) {
    throw new Error(`'${dest}' already exists`)
  }
}

function copyFile (srcStat, src, dest, opts) {
  fs$k.copyFileSync(src, dest);
  if (opts.preserveTimestamps) handleTimestamps(srcStat.mode, src, dest);
  return setDestMode(dest, srcStat.mode)
}

function handleTimestamps (srcMode, src, dest) {
  // Make sure the file is writable before setting the timestamp
  // otherwise open fails with EPERM when invoked with 'r+'
  // (through utimes call)
  if (fileIsNotWritable(srcMode)) makeFileWritable(dest, srcMode);
  return setDestTimestamps(src, dest)
}

function fileIsNotWritable (srcMode) {
  return (srcMode & 0o200) === 0
}

function makeFileWritable (dest, srcMode) {
  return setDestMode(dest, srcMode | 0o200)
}

function setDestMode (dest, srcMode) {
  return fs$k.chmodSync(dest, srcMode)
}

function setDestTimestamps (src, dest) {
  // The initial srcStat.atime cannot be trusted
  // because it is modified by the read(2) system call
  // (See https://nodejs.org/api/fs.html#fs_stat_time_values)
  const updatedSrcStat = fs$k.statSync(src);
  return utimesMillisSync(dest, updatedSrcStat.atime, updatedSrcStat.mtime)
}

function onDir (srcStat, destStat, src, dest, opts) {
  if (!destStat) return mkDirAndCopy(srcStat.mode, src, dest, opts)
  return copyDir(src, dest, opts)
}

function mkDirAndCopy (srcMode, src, dest, opts) {
  fs$k.mkdirSync(dest);
  copyDir(src, dest, opts);
  return setDestMode(dest, srcMode)
}

function copyDir (src, dest, opts) {
  fs$k.readdirSync(src).forEach(item => copyDirItem(item, src, dest, opts));
}

function copyDirItem (item, src, dest, opts) {
  const srcItem = path$k.join(src, item);
  const destItem = path$k.join(dest, item);
  const { destStat } = stat$3.checkPathsSync(srcItem, destItem, 'copy', opts);
  return startCopy(destStat, srcItem, destItem, opts)
}

function onLink (destStat, src, dest, opts) {
  let resolvedSrc = fs$k.readlinkSync(src);
  if (opts.dereference) {
    resolvedSrc = path$k.resolve(process.cwd(), resolvedSrc);
  }

  if (!destStat) {
    return fs$k.symlinkSync(resolvedSrc, dest)
  } else {
    let resolvedDest;
    try {
      resolvedDest = fs$k.readlinkSync(dest);
    } catch (err) {
      // dest exists and is a regular file or directory,
      // Windows may throw UNKNOWN error. If dest already exists,
      // fs throws error anyway, so no need to guard against it here.
      if (err.code === 'EINVAL' || err.code === 'UNKNOWN') return fs$k.symlinkSync(resolvedSrc, dest)
      throw err
    }
    if (opts.dereference) {
      resolvedDest = path$k.resolve(process.cwd(), resolvedDest);
    }
    if (stat$3.isSrcSubdir(resolvedSrc, resolvedDest)) {
      throw new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`)
    }

    // prevent copy if src is a subdir of dest since unlinking
    // dest in this case would result in removing src contents
    // and therefore a broken symlink would be created.
    if (fs$k.statSync(dest).isDirectory() && stat$3.isSrcSubdir(resolvedDest, resolvedSrc)) {
      throw new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`)
    }
    return copyLink(resolvedSrc, dest)
  }
}

function copyLink (resolvedSrc, dest) {
  fs$k.unlinkSync(dest);
  return fs$k.symlinkSync(resolvedSrc, dest)
}

var copySync_1 = copySync$1;

const u$8 = universalify$1.fromCallback;
var copy$1 = {
  copy: u$8(copy_1),
  copySync: copySync_1
};

const fs$j = gracefulFs;
const path$j = require$$0$4;
const assert = require$$5;

const isWindows = (process.platform === 'win32');

function defaults (options) {
  const methods = [
    'unlink',
    'chmod',
    'stat',
    'lstat',
    'rmdir',
    'readdir'
  ];
  methods.forEach(m => {
    options[m] = options[m] || fs$j[m];
    m = m + 'Sync';
    options[m] = options[m] || fs$j[m];
  });

  options.maxBusyTries = options.maxBusyTries || 3;
}

function rimraf$1 (p, options, cb) {
  let busyTries = 0;

  if (typeof options === 'function') {
    cb = options;
    options = {};
  }

  assert(p, 'rimraf: missing path');
  assert.strictEqual(typeof p, 'string', 'rimraf: path should be a string');
  assert.strictEqual(typeof cb, 'function', 'rimraf: callback function required');
  assert(options, 'rimraf: invalid options argument provided');
  assert.strictEqual(typeof options, 'object', 'rimraf: options should be object');

  defaults(options);

  rimraf_(p, options, function CB (er) {
    if (er) {
      if ((er.code === 'EBUSY' || er.code === 'ENOTEMPTY' || er.code === 'EPERM') &&
          busyTries < options.maxBusyTries) {
        busyTries++;
        const time = busyTries * 100;
        // try again, with the same exact callback as this one.
        return setTimeout(() => rimraf_(p, options, CB), time)
      }

      // already gone
      if (er.code === 'ENOENT') er = null;
    }

    cb(er);
  });
}

// Two possible strategies.
// 1. Assume it's a file.  unlink it, then do the dir stuff on EPERM or EISDIR
// 2. Assume it's a directory.  readdir, then do the file stuff on ENOTDIR
//
// Both result in an extra syscall when you guess wrong.  However, there
// are likely far more normal files in the world than directories.  This
// is based on the assumption that a the average number of files per
// directory is >= 1.
//
// If anyone ever complains about this, then I guess the strategy could
// be made configurable somehow.  But until then, YAGNI.
function rimraf_ (p, options, cb) {
  assert(p);
  assert(options);
  assert(typeof cb === 'function');

  // sunos lets the root user unlink directories, which is... weird.
  // so we have to lstat here and make sure it's not a dir.
  options.lstat(p, (er, st) => {
    if (er && er.code === 'ENOENT') {
      return cb(null)
    }

    // Windows can EPERM on stat.  Life is suffering.
    if (er && er.code === 'EPERM' && isWindows) {
      return fixWinEPERM(p, options, er, cb)
    }

    if (st && st.isDirectory()) {
      return rmdir(p, options, er, cb)
    }

    options.unlink(p, er => {
      if (er) {
        if (er.code === 'ENOENT') {
          return cb(null)
        }
        if (er.code === 'EPERM') {
          return (isWindows)
            ? fixWinEPERM(p, options, er, cb)
            : rmdir(p, options, er, cb)
        }
        if (er.code === 'EISDIR') {
          return rmdir(p, options, er, cb)
        }
      }
      return cb(er)
    });
  });
}

function fixWinEPERM (p, options, er, cb) {
  assert(p);
  assert(options);
  assert(typeof cb === 'function');

  options.chmod(p, 0o666, er2 => {
    if (er2) {
      cb(er2.code === 'ENOENT' ? null : er);
    } else {
      options.stat(p, (er3, stats) => {
        if (er3) {
          cb(er3.code === 'ENOENT' ? null : er);
        } else if (stats.isDirectory()) {
          rmdir(p, options, er, cb);
        } else {
          options.unlink(p, cb);
        }
      });
    }
  });
}

function fixWinEPERMSync (p, options, er) {
  let stats;

  assert(p);
  assert(options);

  try {
    options.chmodSync(p, 0o666);
  } catch (er2) {
    if (er2.code === 'ENOENT') {
      return
    } else {
      throw er
    }
  }

  try {
    stats = options.statSync(p);
  } catch (er3) {
    if (er3.code === 'ENOENT') {
      return
    } else {
      throw er
    }
  }

  if (stats.isDirectory()) {
    rmdirSync(p, options, er);
  } else {
    options.unlinkSync(p);
  }
}

function rmdir (p, options, originalEr, cb) {
  assert(p);
  assert(options);
  assert(typeof cb === 'function');

  // try to rmdir first, and only readdir on ENOTEMPTY or EEXIST (SunOS)
  // if we guessed wrong, and it's not a directory, then
  // raise the original error.
  options.rmdir(p, er => {
    if (er && (er.code === 'ENOTEMPTY' || er.code === 'EEXIST' || er.code === 'EPERM')) {
      rmkids(p, options, cb);
    } else if (er && er.code === 'ENOTDIR') {
      cb(originalEr);
    } else {
      cb(er);
    }
  });
}

function rmkids (p, options, cb) {
  assert(p);
  assert(options);
  assert(typeof cb === 'function');

  options.readdir(p, (er, files) => {
    if (er) return cb(er)

    let n = files.length;
    let errState;

    if (n === 0) return options.rmdir(p, cb)

    files.forEach(f => {
      rimraf$1(path$j.join(p, f), options, er => {
        if (errState) {
          return
        }
        if (er) return cb(errState = er)
        if (--n === 0) {
          options.rmdir(p, cb);
        }
      });
    });
  });
}

// this looks simpler, and is strictly *faster*, but will
// tie up the JavaScript thread and fail on excessively
// deep directory trees.
function rimrafSync (p, options) {
  let st;

  options = options || {};
  defaults(options);

  assert(p, 'rimraf: missing path');
  assert.strictEqual(typeof p, 'string', 'rimraf: path should be a string');
  assert(options, 'rimraf: missing options');
  assert.strictEqual(typeof options, 'object', 'rimraf: options should be object');

  try {
    st = options.lstatSync(p);
  } catch (er) {
    if (er.code === 'ENOENT') {
      return
    }

    // Windows can EPERM on stat.  Life is suffering.
    if (er.code === 'EPERM' && isWindows) {
      fixWinEPERMSync(p, options, er);
    }
  }

  try {
    // sunos lets the root user unlink directories, which is... weird.
    if (st && st.isDirectory()) {
      rmdirSync(p, options, null);
    } else {
      options.unlinkSync(p);
    }
  } catch (er) {
    if (er.code === 'ENOENT') {
      return
    } else if (er.code === 'EPERM') {
      return isWindows ? fixWinEPERMSync(p, options, er) : rmdirSync(p, options, er)
    } else if (er.code !== 'EISDIR') {
      throw er
    }
    rmdirSync(p, options, er);
  }
}

function rmdirSync (p, options, originalEr) {
  assert(p);
  assert(options);

  try {
    options.rmdirSync(p);
  } catch (er) {
    if (er.code === 'ENOTDIR') {
      throw originalEr
    } else if (er.code === 'ENOTEMPTY' || er.code === 'EEXIST' || er.code === 'EPERM') {
      rmkidsSync(p, options);
    } else if (er.code !== 'ENOENT') {
      throw er
    }
  }
}

function rmkidsSync (p, options) {
  assert(p);
  assert(options);
  options.readdirSync(p).forEach(f => rimrafSync(path$j.join(p, f), options));

  if (isWindows) {
    // We only end up here once we got ENOTEMPTY at least once, and
    // at this point, we are guaranteed to have removed all the kids.
    // So, we know that it won't be ENOENT or ENOTDIR or anything else.
    // try really hard to delete stuff on windows, because it has a
    // PROFOUNDLY annoying habit of not closing handles promptly when
    // files are deleted, resulting in spurious ENOTEMPTY errors.
    const startTime = Date.now();
    do {
      try {
        const ret = options.rmdirSync(p, options);
        return ret
      } catch {}
    } while (Date.now() - startTime < 500) // give up after 500ms
  } else {
    const ret = options.rmdirSync(p, options);
    return ret
  }
}

var rimraf_1 = rimraf$1;
rimraf$1.sync = rimrafSync;

const fs$i = gracefulFs;
const u$7 = universalify$1.fromCallback;
const rimraf = rimraf_1;

function remove$2 (path, callback) {
  // Node 14.14.0+
  if (fs$i.rm) return fs$i.rm(path, { recursive: true, force: true }, callback)
  rimraf(path, callback);
}

function removeSync$1 (path) {
  // Node 14.14.0+
  if (fs$i.rmSync) return fs$i.rmSync(path, { recursive: true, force: true })
  rimraf.sync(path);
}

var remove_1 = {
  remove: u$7(remove$2),
  removeSync: removeSync$1
};

const u$6 = universalify$1.fromPromise;
const fs$h = fs$r;
const path$i = require$$0$4;
const mkdir$3 = mkdirs$2;
const remove$1 = remove_1;

const emptyDir = u$6(async function emptyDir (dir) {
  let items;
  try {
    items = await fs$h.readdir(dir);
  } catch {
    return mkdir$3.mkdirs(dir)
  }

  return Promise.all(items.map(item => remove$1.remove(path$i.join(dir, item))))
});

function emptyDirSync (dir) {
  let items;
  try {
    items = fs$h.readdirSync(dir);
  } catch {
    return mkdir$3.mkdirsSync(dir)
  }

  items.forEach(item => {
    item = path$i.join(dir, item);
    remove$1.removeSync(item);
  });
}

var empty = {
  emptyDirSync,
  emptydirSync: emptyDirSync,
  emptyDir,
  emptydir: emptyDir
};

const u$5 = universalify$1.fromCallback;
const path$h = require$$0$4;
const fs$g = gracefulFs;
const mkdir$2 = mkdirs$2;

function createFile$1 (file, callback) {
  function makeFile () {
    fs$g.writeFile(file, '', err => {
      if (err) return callback(err)
      callback();
    });
  }

  fs$g.stat(file, (err, stats) => { // eslint-disable-line handle-callback-err
    if (!err && stats.isFile()) return callback()
    const dir = path$h.dirname(file);
    fs$g.stat(dir, (err, stats) => {
      if (err) {
        // if the directory doesn't exist, make it
        if (err.code === 'ENOENT') {
          return mkdir$2.mkdirs(dir, err => {
            if (err) return callback(err)
            makeFile();
          })
        }
        return callback(err)
      }

      if (stats.isDirectory()) makeFile();
      else {
        // parent is not a directory
        // This is just to cause an internal ENOTDIR error to be thrown
        fs$g.readdir(dir, err => {
          if (err) return callback(err)
        });
      }
    });
  });
}

function createFileSync$1 (file) {
  let stats;
  try {
    stats = fs$g.statSync(file);
  } catch {}
  if (stats && stats.isFile()) return

  const dir = path$h.dirname(file);
  try {
    if (!fs$g.statSync(dir).isDirectory()) {
      // parent is not a directory
      // This is just to cause an internal ENOTDIR error to be thrown
      fs$g.readdirSync(dir);
    }
  } catch (err) {
    // If the stat call above failed because the directory doesn't exist, create it
    if (err && err.code === 'ENOENT') mkdir$2.mkdirsSync(dir);
    else throw err
  }

  fs$g.writeFileSync(file, '');
}

var file = {
  createFile: u$5(createFile$1),
  createFileSync: createFileSync$1
};

const u$4 = universalify$1.fromCallback;
const path$g = require$$0$4;
const fs$f = gracefulFs;
const mkdir$1 = mkdirs$2;
const pathExists$4 = pathExists_1.pathExists;
const { areIdentical: areIdentical$1 } = stat$5;

function createLink$1 (srcpath, dstpath, callback) {
  function makeLink (srcpath, dstpath) {
    fs$f.link(srcpath, dstpath, err => {
      if (err) return callback(err)
      callback(null);
    });
  }

  fs$f.lstat(dstpath, (_, dstStat) => {
    fs$f.lstat(srcpath, (err, srcStat) => {
      if (err) {
        err.message = err.message.replace('lstat', 'ensureLink');
        return callback(err)
      }
      if (dstStat && areIdentical$1(srcStat, dstStat)) return callback(null)

      const dir = path$g.dirname(dstpath);
      pathExists$4(dir, (err, dirExists) => {
        if (err) return callback(err)
        if (dirExists) return makeLink(srcpath, dstpath)
        mkdir$1.mkdirs(dir, err => {
          if (err) return callback(err)
          makeLink(srcpath, dstpath);
        });
      });
    });
  });
}

function createLinkSync$1 (srcpath, dstpath) {
  let dstStat;
  try {
    dstStat = fs$f.lstatSync(dstpath);
  } catch {}

  try {
    const srcStat = fs$f.lstatSync(srcpath);
    if (dstStat && areIdentical$1(srcStat, dstStat)) return
  } catch (err) {
    err.message = err.message.replace('lstat', 'ensureLink');
    throw err
  }

  const dir = path$g.dirname(dstpath);
  const dirExists = fs$f.existsSync(dir);
  if (dirExists) return fs$f.linkSync(srcpath, dstpath)
  mkdir$1.mkdirsSync(dir);

  return fs$f.linkSync(srcpath, dstpath)
}

var link = {
  createLink: u$4(createLink$1),
  createLinkSync: createLinkSync$1
};

const path$f = require$$0$4;
const fs$e = gracefulFs;
const pathExists$3 = pathExists_1.pathExists;

/**
 * Function that returns two types of paths, one relative to symlink, and one
 * relative to the current working directory. Checks if path is absolute or
 * relative. If the path is relative, this function checks if the path is
 * relative to symlink or relative to current working directory. This is an
 * initiative to find a smarter `srcpath` to supply when building symlinks.
 * This allows you to determine which path to use out of one of three possible
 * types of source paths. The first is an absolute path. This is detected by
 * `path.isAbsolute()`. When an absolute path is provided, it is checked to
 * see if it exists. If it does it's used, if not an error is returned
 * (callback)/ thrown (sync). The other two options for `srcpath` are a
 * relative url. By default Node's `fs.symlink` works by creating a symlink
 * using `dstpath` and expects the `srcpath` to be relative to the newly
 * created symlink. If you provide a `srcpath` that does not exist on the file
 * system it results in a broken symlink. To minimize this, the function
 * checks to see if the 'relative to symlink' source file exists, and if it
 * does it will use it. If it does not, it checks if there's a file that
 * exists that is relative to the current working directory, if does its used.
 * This preserves the expectations of the original fs.symlink spec and adds
 * the ability to pass in `relative to current working direcotry` paths.
 */

function symlinkPaths$1 (srcpath, dstpath, callback) {
  if (path$f.isAbsolute(srcpath)) {
    return fs$e.lstat(srcpath, (err) => {
      if (err) {
        err.message = err.message.replace('lstat', 'ensureSymlink');
        return callback(err)
      }
      return callback(null, {
        toCwd: srcpath,
        toDst: srcpath
      })
    })
  } else {
    const dstdir = path$f.dirname(dstpath);
    const relativeToDst = path$f.join(dstdir, srcpath);
    return pathExists$3(relativeToDst, (err, exists) => {
      if (err) return callback(err)
      if (exists) {
        return callback(null, {
          toCwd: relativeToDst,
          toDst: srcpath
        })
      } else {
        return fs$e.lstat(srcpath, (err) => {
          if (err) {
            err.message = err.message.replace('lstat', 'ensureSymlink');
            return callback(err)
          }
          return callback(null, {
            toCwd: srcpath,
            toDst: path$f.relative(dstdir, srcpath)
          })
        })
      }
    })
  }
}

function symlinkPathsSync$1 (srcpath, dstpath) {
  let exists;
  if (path$f.isAbsolute(srcpath)) {
    exists = fs$e.existsSync(srcpath);
    if (!exists) throw new Error('absolute srcpath does not exist')
    return {
      toCwd: srcpath,
      toDst: srcpath
    }
  } else {
    const dstdir = path$f.dirname(dstpath);
    const relativeToDst = path$f.join(dstdir, srcpath);
    exists = fs$e.existsSync(relativeToDst);
    if (exists) {
      return {
        toCwd: relativeToDst,
        toDst: srcpath
      }
    } else {
      exists = fs$e.existsSync(srcpath);
      if (!exists) throw new Error('relative srcpath does not exist')
      return {
        toCwd: srcpath,
        toDst: path$f.relative(dstdir, srcpath)
      }
    }
  }
}

var symlinkPaths_1 = {
  symlinkPaths: symlinkPaths$1,
  symlinkPathsSync: symlinkPathsSync$1
};

const fs$d = gracefulFs;

function symlinkType$1 (srcpath, type, callback) {
  callback = (typeof type === 'function') ? type : callback;
  type = (typeof type === 'function') ? false : type;
  if (type) return callback(null, type)
  fs$d.lstat(srcpath, (err, stats) => {
    if (err) return callback(null, 'file')
    type = (stats && stats.isDirectory()) ? 'dir' : 'file';
    callback(null, type);
  });
}

function symlinkTypeSync$1 (srcpath, type) {
  let stats;

  if (type) return type
  try {
    stats = fs$d.lstatSync(srcpath);
  } catch {
    return 'file'
  }
  return (stats && stats.isDirectory()) ? 'dir' : 'file'
}

var symlinkType_1 = {
  symlinkType: symlinkType$1,
  symlinkTypeSync: symlinkTypeSync$1
};

const u$3 = universalify$1.fromCallback;
const path$e = require$$0$4;
const fs$c = fs$r;
const _mkdirs = mkdirs$2;
const mkdirs = _mkdirs.mkdirs;
const mkdirsSync = _mkdirs.mkdirsSync;

const _symlinkPaths = symlinkPaths_1;
const symlinkPaths = _symlinkPaths.symlinkPaths;
const symlinkPathsSync = _symlinkPaths.symlinkPathsSync;

const _symlinkType = symlinkType_1;
const symlinkType = _symlinkType.symlinkType;
const symlinkTypeSync = _symlinkType.symlinkTypeSync;

const pathExists$2 = pathExists_1.pathExists;

const { areIdentical } = stat$5;

function createSymlink$1 (srcpath, dstpath, type, callback) {
  callback = (typeof type === 'function') ? type : callback;
  type = (typeof type === 'function') ? false : type;

  fs$c.lstat(dstpath, (err, stats) => {
    if (!err && stats.isSymbolicLink()) {
      Promise.all([
        fs$c.stat(srcpath),
        fs$c.stat(dstpath)
      ]).then(([srcStat, dstStat]) => {
        if (areIdentical(srcStat, dstStat)) return callback(null)
        _createSymlink(srcpath, dstpath, type, callback);
      });
    } else _createSymlink(srcpath, dstpath, type, callback);
  });
}

function _createSymlink (srcpath, dstpath, type, callback) {
  symlinkPaths(srcpath, dstpath, (err, relative) => {
    if (err) return callback(err)
    srcpath = relative.toDst;
    symlinkType(relative.toCwd, type, (err, type) => {
      if (err) return callback(err)
      const dir = path$e.dirname(dstpath);
      pathExists$2(dir, (err, dirExists) => {
        if (err) return callback(err)
        if (dirExists) return fs$c.symlink(srcpath, dstpath, type, callback)
        mkdirs(dir, err => {
          if (err) return callback(err)
          fs$c.symlink(srcpath, dstpath, type, callback);
        });
      });
    });
  });
}

function createSymlinkSync$1 (srcpath, dstpath, type) {
  let stats;
  try {
    stats = fs$c.lstatSync(dstpath);
  } catch {}
  if (stats && stats.isSymbolicLink()) {
    const srcStat = fs$c.statSync(srcpath);
    const dstStat = fs$c.statSync(dstpath);
    if (areIdentical(srcStat, dstStat)) return
  }

  const relative = symlinkPathsSync(srcpath, dstpath);
  srcpath = relative.toDst;
  type = symlinkTypeSync(relative.toCwd, type);
  const dir = path$e.dirname(dstpath);
  const exists = fs$c.existsSync(dir);
  if (exists) return fs$c.symlinkSync(srcpath, dstpath, type)
  mkdirsSync(dir);
  return fs$c.symlinkSync(srcpath, dstpath, type)
}

var symlink = {
  createSymlink: u$3(createSymlink$1),
  createSymlinkSync: createSymlinkSync$1
};

const { createFile, createFileSync } = file;
const { createLink, createLinkSync } = link;
const { createSymlink, createSymlinkSync } = symlink;

var ensure = {
  // file
  createFile,
  createFileSync,
  ensureFile: createFile,
  ensureFileSync: createFileSync,
  // link
  createLink,
  createLinkSync,
  ensureLink: createLink,
  ensureLinkSync: createLinkSync,
  // symlink
  createSymlink,
  createSymlinkSync,
  ensureSymlink: createSymlink,
  ensureSymlinkSync: createSymlinkSync
};

function stringify$8 (obj, { EOL = '\n', finalEOL = true, replacer = null, spaces } = {}) {
  const EOF = finalEOL ? EOL : '';
  const str = JSON.stringify(obj, replacer, spaces);

  return str.replace(/\n/g, EOL) + EOF
}

function stripBom$1 (content) {
  // we do this because JSON.parse would convert it to a utf8 string if encoding wasn't specified
  if (Buffer.isBuffer(content)) content = content.toString('utf8');
  return content.replace(/^\uFEFF/, '')
}

var utils$l = { stringify: stringify$8, stripBom: stripBom$1 };

let _fs;
try {
  _fs = require('graceful-fs');
} catch (_) {
  _fs = require$$0$2;
}
const universalify = universalify$1;
const { stringify: stringify$7, stripBom } = utils$l;

async function _readFile (file, options = {}) {
  if (typeof options === 'string') {
    options = { encoding: options };
  }

  const fs = options.fs || _fs;

  const shouldThrow = 'throws' in options ? options.throws : true;

  let data = await universalify.fromCallback(fs.readFile)(file, options);

  data = stripBom(data);

  let obj;
  try {
    obj = JSON.parse(data, options ? options.reviver : null);
  } catch (err) {
    if (shouldThrow) {
      err.message = `${file}: ${err.message}`;
      throw err
    } else {
      return null
    }
  }

  return obj
}

const readFile = universalify.fromPromise(_readFile);

function readFileSync (file, options = {}) {
  if (typeof options === 'string') {
    options = { encoding: options };
  }

  const fs = options.fs || _fs;

  const shouldThrow = 'throws' in options ? options.throws : true;

  try {
    let content = fs.readFileSync(file, options);
    content = stripBom(content);
    return JSON.parse(content, options.reviver)
  } catch (err) {
    if (shouldThrow) {
      err.message = `${file}: ${err.message}`;
      throw err
    } else {
      return null
    }
  }
}

async function _writeFile (file, obj, options = {}) {
  const fs = options.fs || _fs;

  const str = stringify$7(obj, options);

  await universalify.fromCallback(fs.writeFile)(file, str, options);
}

const writeFile = universalify.fromPromise(_writeFile);

function writeFileSync (file, obj, options = {}) {
  const fs = options.fs || _fs;

  const str = stringify$7(obj, options);
  // not sure if fs.writeFileSync returns anything, but just in case
  return fs.writeFileSync(file, str, options)
}

const jsonfile$1 = {
  readFile,
  readFileSync,
  writeFile,
  writeFileSync
};

var jsonfile_1 = jsonfile$1;

const jsonFile$1 = jsonfile_1;

var jsonfile = {
  // jsonfile exports
  readJson: jsonFile$1.readFile,
  readJsonSync: jsonFile$1.readFileSync,
  writeJson: jsonFile$1.writeFile,
  writeJsonSync: jsonFile$1.writeFileSync
};

const u$2 = universalify$1.fromCallback;
const fs$b = gracefulFs;
const path$d = require$$0$4;
const mkdir = mkdirs$2;
const pathExists$1 = pathExists_1.pathExists;

function outputFile$1 (file, data, encoding, callback) {
  if (typeof encoding === 'function') {
    callback = encoding;
    encoding = 'utf8';
  }

  const dir = path$d.dirname(file);
  pathExists$1(dir, (err, itDoes) => {
    if (err) return callback(err)
    if (itDoes) return fs$b.writeFile(file, data, encoding, callback)

    mkdir.mkdirs(dir, err => {
      if (err) return callback(err)

      fs$b.writeFile(file, data, encoding, callback);
    });
  });
}

function outputFileSync$1 (file, ...args) {
  const dir = path$d.dirname(file);
  if (fs$b.existsSync(dir)) {
    return fs$b.writeFileSync(file, ...args)
  }
  mkdir.mkdirsSync(dir);
  fs$b.writeFileSync(file, ...args);
}

var outputFile_1 = {
  outputFile: u$2(outputFile$1),
  outputFileSync: outputFileSync$1
};

const { stringify: stringify$6 } = utils$l;
const { outputFile } = outputFile_1;

async function outputJson (file, data, options = {}) {
  const str = stringify$6(data, options);

  await outputFile(file, str, options);
}

var outputJson_1 = outputJson;

const { stringify: stringify$5 } = utils$l;
const { outputFileSync } = outputFile_1;

function outputJsonSync (file, data, options) {
  const str = stringify$5(data, options);

  outputFileSync(file, str, options);
}

var outputJsonSync_1 = outputJsonSync;

const u$1 = universalify$1.fromPromise;
const jsonFile = jsonfile;

jsonFile.outputJson = u$1(outputJson_1);
jsonFile.outputJsonSync = outputJsonSync_1;
// aliases
jsonFile.outputJSON = jsonFile.outputJson;
jsonFile.outputJSONSync = jsonFile.outputJsonSync;
jsonFile.writeJSON = jsonFile.writeJson;
jsonFile.writeJSONSync = jsonFile.writeJsonSync;
jsonFile.readJSON = jsonFile.readJson;
jsonFile.readJSONSync = jsonFile.readJsonSync;

var json = jsonFile;

const fs$a = gracefulFs;
const path$c = require$$0$4;
const copy = copy$1.copy;
const remove = remove_1.remove;
const mkdirp = mkdirs$2.mkdirp;
const pathExists = pathExists_1.pathExists;
const stat$2 = stat$5;

function move$1 (src, dest, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }

  opts = opts || {};

  const overwrite = opts.overwrite || opts.clobber || false;

  stat$2.checkPaths(src, dest, 'move', opts, (err, stats) => {
    if (err) return cb(err)
    const { srcStat, isChangingCase = false } = stats;
    stat$2.checkParentPaths(src, srcStat, dest, 'move', err => {
      if (err) return cb(err)
      if (isParentRoot$1(dest)) return doRename$1(src, dest, overwrite, isChangingCase, cb)
      mkdirp(path$c.dirname(dest), err => {
        if (err) return cb(err)
        return doRename$1(src, dest, overwrite, isChangingCase, cb)
      });
    });
  });
}

function isParentRoot$1 (dest) {
  const parent = path$c.dirname(dest);
  const parsedPath = path$c.parse(parent);
  return parsedPath.root === parent
}

function doRename$1 (src, dest, overwrite, isChangingCase, cb) {
  if (isChangingCase) return rename$1(src, dest, overwrite, cb)
  if (overwrite) {
    return remove(dest, err => {
      if (err) return cb(err)
      return rename$1(src, dest, overwrite, cb)
    })
  }
  pathExists(dest, (err, destExists) => {
    if (err) return cb(err)
    if (destExists) return cb(new Error('dest already exists.'))
    return rename$1(src, dest, overwrite, cb)
  });
}

function rename$1 (src, dest, overwrite, cb) {
  fs$a.rename(src, dest, err => {
    if (!err) return cb()
    if (err.code !== 'EXDEV') return cb(err)
    return moveAcrossDevice$1(src, dest, overwrite, cb)
  });
}

function moveAcrossDevice$1 (src, dest, overwrite, cb) {
  const opts = {
    overwrite,
    errorOnExist: true
  };
  copy(src, dest, opts, err => {
    if (err) return cb(err)
    return remove(src, cb)
  });
}

var move_1 = move$1;

const fs$9 = gracefulFs;
const path$b = require$$0$4;
const copySync = copy$1.copySync;
const removeSync = remove_1.removeSync;
const mkdirpSync = mkdirs$2.mkdirpSync;
const stat$1 = stat$5;

function moveSync (src, dest, opts) {
  opts = opts || {};
  const overwrite = opts.overwrite || opts.clobber || false;

  const { srcStat, isChangingCase = false } = stat$1.checkPathsSync(src, dest, 'move', opts);
  stat$1.checkParentPathsSync(src, srcStat, dest, 'move');
  if (!isParentRoot(dest)) mkdirpSync(path$b.dirname(dest));
  return doRename(src, dest, overwrite, isChangingCase)
}

function isParentRoot (dest) {
  const parent = path$b.dirname(dest);
  const parsedPath = path$b.parse(parent);
  return parsedPath.root === parent
}

function doRename (src, dest, overwrite, isChangingCase) {
  if (isChangingCase) return rename(src, dest, overwrite)
  if (overwrite) {
    removeSync(dest);
    return rename(src, dest, overwrite)
  }
  if (fs$9.existsSync(dest)) throw new Error('dest already exists.')
  return rename(src, dest, overwrite)
}

function rename (src, dest, overwrite) {
  try {
    fs$9.renameSync(src, dest);
  } catch (err) {
    if (err.code !== 'EXDEV') throw err
    return moveAcrossDevice(src, dest, overwrite)
  }
}

function moveAcrossDevice (src, dest, overwrite) {
  const opts = {
    overwrite,
    errorOnExist: true
  };
  copySync(src, dest, opts);
  return removeSync(src)
}

var moveSync_1 = moveSync;

const u = universalify$1.fromCallback;
var move = {
  move: u(move_1),
  moveSync: moveSync_1
};

var lib = {
  // Export promiseified graceful-fs:
  ...fs$r,
  // Export extra methods:
  ...copy$1,
  ...empty,
  ...ensure,
  ...json,
  ...mkdirs$2,
  ...move,
  ...outputFile_1,
  ...pathExists_1,
  ...remove_1
};

/*
 * merge2
 * https://github.com/teambition/merge2
 *
 * Copyright (c) 2014-2020 Teambition
 * Licensed under the MIT license.
 */
const Stream = require$$0$1;
const PassThrough = Stream.PassThrough;
const slice = Array.prototype.slice;

var merge2_1 = merge2$1;

function merge2$1 () {
  const streamsQueue = [];
  const args = slice.call(arguments);
  let merging = false;
  let options = args[args.length - 1];

  if (options && !Array.isArray(options) && options.pipe == null) {
    args.pop();
  } else {
    options = {};
  }

  const doEnd = options.end !== false;
  const doPipeError = options.pipeError === true;
  if (options.objectMode == null) {
    options.objectMode = true;
  }
  if (options.highWaterMark == null) {
    options.highWaterMark = 64 * 1024;
  }
  const mergedStream = PassThrough(options);

  function addStream () {
    for (let i = 0, len = arguments.length; i < len; i++) {
      streamsQueue.push(pauseStreams(arguments[i], options));
    }
    mergeStream();
    return this
  }

  function mergeStream () {
    if (merging) {
      return
    }
    merging = true;

    let streams = streamsQueue.shift();
    if (!streams) {
      process.nextTick(endStream);
      return
    }
    if (!Array.isArray(streams)) {
      streams = [streams];
    }

    let pipesCount = streams.length + 1;

    function next () {
      if (--pipesCount > 0) {
        return
      }
      merging = false;
      mergeStream();
    }

    function pipe (stream) {
      function onend () {
        stream.removeListener('merge2UnpipeEnd', onend);
        stream.removeListener('end', onend);
        if (doPipeError) {
          stream.removeListener('error', onerror);
        }
        next();
      }
      function onerror (err) {
        mergedStream.emit('error', err);
      }
      // skip ended stream
      if (stream._readableState.endEmitted) {
        return next()
      }

      stream.on('merge2UnpipeEnd', onend);
      stream.on('end', onend);

      if (doPipeError) {
        stream.on('error', onerror);
      }

      stream.pipe(mergedStream, { end: false });
      // compatible for old stream
      stream.resume();
    }

    for (let i = 0; i < streams.length; i++) {
      pipe(streams[i]);
    }

    next();
  }

  function endStream () {
    merging = false;
    // emit 'queueDrain' when all streams merged.
    mergedStream.emit('queueDrain');
    if (doEnd) {
      mergedStream.end();
    }
  }

  mergedStream.setMaxListeners(0);
  mergedStream.add = addStream;
  mergedStream.on('unpipe', function (stream) {
    stream.emit('merge2UnpipeEnd');
  });

  if (args.length) {
    addStream.apply(null, args);
  }
  return mergedStream
}

// check and pause streams for pipe.
function pauseStreams (streams, options) {
  if (!Array.isArray(streams)) {
    // Backwards-compat with old-style streams
    if (!streams._readableState && streams.pipe) {
      streams = streams.pipe(PassThrough(options));
    }
    if (!streams._readableState || !streams.pause || !streams.pipe) {
      throw new Error('Only readable stream can be merged.')
    }
    streams.pause();
  } else {
    for (let i = 0, len = streams.length; i < len; i++) {
      streams[i] = pauseStreams(streams[i], options);
    }
  }
  return streams
}

var tasks = {};

var utils$k = {};

var array$1 = {};

Object.defineProperty(array$1, "__esModule", { value: true });
array$1.splitWhen = array$1.flatten = void 0;
function flatten(items) {
    return items.reduce((collection, item) => [].concat(collection, item), []);
}
array$1.flatten = flatten;
function splitWhen(items, predicate) {
    const result = [[]];
    let groupIndex = 0;
    for (const item of items) {
        if (predicate(item)) {
            groupIndex++;
            result[groupIndex] = [];
        }
        else {
            result[groupIndex].push(item);
        }
    }
    return result;
}
array$1.splitWhen = splitWhen;

var errno$1 = {};

Object.defineProperty(errno$1, "__esModule", { value: true });
errno$1.isEnoentCodeError = void 0;
function isEnoentCodeError(error) {
    return error.code === 'ENOENT';
}
errno$1.isEnoentCodeError = isEnoentCodeError;

var fs$8 = {};

Object.defineProperty(fs$8, "__esModule", { value: true });
fs$8.createDirentFromStats = void 0;
class DirentFromStats$1 {
    constructor(name, stats) {
        this.name = name;
        this.isBlockDevice = stats.isBlockDevice.bind(stats);
        this.isCharacterDevice = stats.isCharacterDevice.bind(stats);
        this.isDirectory = stats.isDirectory.bind(stats);
        this.isFIFO = stats.isFIFO.bind(stats);
        this.isFile = stats.isFile.bind(stats);
        this.isSocket = stats.isSocket.bind(stats);
        this.isSymbolicLink = stats.isSymbolicLink.bind(stats);
    }
}
function createDirentFromStats$1(name, stats) {
    return new DirentFromStats$1(name, stats);
}
fs$8.createDirentFromStats = createDirentFromStats$1;

var path$a = {};

Object.defineProperty(path$a, "__esModule", { value: true });
path$a.removeLeadingDotSegment = path$a.escape = path$a.makeAbsolute = path$a.unixify = void 0;
const path$9 = require$$0$4;
const LEADING_DOT_SEGMENT_CHARACTERS_COUNT = 2; // ./ or .\\
const UNESCAPED_GLOB_SYMBOLS_RE = /(\\?)([()*?[\]{|}]|^!|[!+@](?=\())/g;
/**
 * Designed to work only with simple paths: `dir\\file`.
 */
function unixify(filepath) {
    return filepath.replace(/\\/g, '/');
}
path$a.unixify = unixify;
function makeAbsolute(cwd, filepath) {
    return path$9.resolve(cwd, filepath);
}
path$a.makeAbsolute = makeAbsolute;
function escape(pattern) {
    return pattern.replace(UNESCAPED_GLOB_SYMBOLS_RE, '\\$2');
}
path$a.escape = escape;
function removeLeadingDotSegment(entry) {
    // We do not use `startsWith` because this is 10x slower than current implementation for some cases.
    // eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
    if (entry.charAt(0) === '.') {
        const secondCharactery = entry.charAt(1);
        if (secondCharactery === '/' || secondCharactery === '\\') {
            return entry.slice(LEADING_DOT_SEGMENT_CHARACTERS_COUNT);
        }
    }
    return entry;
}
path$a.removeLeadingDotSegment = removeLeadingDotSegment;

var pattern$1 = {};

/*!
 * is-extglob <https://github.com/jonschlinkert/is-extglob>
 *
 * Copyright (c) 2014-2016, Jon Schlinkert.
 * Licensed under the MIT License.
 */

var isExtglob$1 = function isExtglob(str) {
  if (typeof str !== 'string' || str === '') {
    return false;
  }

  var match;
  while ((match = /(\\).|([@?!+*]\(.*\))/g.exec(str))) {
    if (match[2]) return true;
    str = str.slice(match.index + match[0].length);
  }

  return false;
};

/*!
 * is-glob <https://github.com/jonschlinkert/is-glob>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */

var isExtglob = isExtglob$1;
var chars = { '{': '}', '(': ')', '[': ']'};
var strictCheck = function(str) {
  if (str[0] === '!') {
    return true;
  }
  var index = 0;
  var pipeIndex = -2;
  var closeSquareIndex = -2;
  var closeCurlyIndex = -2;
  var closeParenIndex = -2;
  var backSlashIndex = -2;
  while (index < str.length) {
    if (str[index] === '*') {
      return true;
    }

    if (str[index + 1] === '?' && /[\].+)]/.test(str[index])) {
      return true;
    }

    if (closeSquareIndex !== -1 && str[index] === '[' && str[index + 1] !== ']') {
      if (closeSquareIndex < index) {
        closeSquareIndex = str.indexOf(']', index);
      }
      if (closeSquareIndex > index) {
        if (backSlashIndex === -1 || backSlashIndex > closeSquareIndex) {
          return true;
        }
        backSlashIndex = str.indexOf('\\', index);
        if (backSlashIndex === -1 || backSlashIndex > closeSquareIndex) {
          return true;
        }
      }
    }

    if (closeCurlyIndex !== -1 && str[index] === '{' && str[index + 1] !== '}') {
      closeCurlyIndex = str.indexOf('}', index);
      if (closeCurlyIndex > index) {
        backSlashIndex = str.indexOf('\\', index);
        if (backSlashIndex === -1 || backSlashIndex > closeCurlyIndex) {
          return true;
        }
      }
    }

    if (closeParenIndex !== -1 && str[index] === '(' && str[index + 1] === '?' && /[:!=]/.test(str[index + 2]) && str[index + 3] !== ')') {
      closeParenIndex = str.indexOf(')', index);
      if (closeParenIndex > index) {
        backSlashIndex = str.indexOf('\\', index);
        if (backSlashIndex === -1 || backSlashIndex > closeParenIndex) {
          return true;
        }
      }
    }

    if (pipeIndex !== -1 && str[index] === '(' && str[index + 1] !== '|') {
      if (pipeIndex < index) {
        pipeIndex = str.indexOf('|', index);
      }
      if (pipeIndex !== -1 && str[pipeIndex + 1] !== ')') {
        closeParenIndex = str.indexOf(')', pipeIndex);
        if (closeParenIndex > pipeIndex) {
          backSlashIndex = str.indexOf('\\', pipeIndex);
          if (backSlashIndex === -1 || backSlashIndex > closeParenIndex) {
            return true;
          }
        }
      }
    }

    if (str[index] === '\\') {
      var open = str[index + 1];
      index += 2;
      var close = chars[open];

      if (close) {
        var n = str.indexOf(close, index);
        if (n !== -1) {
          index = n + 1;
        }
      }

      if (str[index] === '!') {
        return true;
      }
    } else {
      index++;
    }
  }
  return false;
};

var relaxedCheck = function(str) {
  if (str[0] === '!') {
    return true;
  }
  var index = 0;
  while (index < str.length) {
    if (/[*?{}()[\]]/.test(str[index])) {
      return true;
    }

    if (str[index] === '\\') {
      var open = str[index + 1];
      index += 2;
      var close = chars[open];

      if (close) {
        var n = str.indexOf(close, index);
        if (n !== -1) {
          index = n + 1;
        }
      }

      if (str[index] === '!') {
        return true;
      }
    } else {
      index++;
    }
  }
  return false;
};

var isGlob$1 = function isGlob(str, options) {
  if (typeof str !== 'string' || str === '') {
    return false;
  }

  if (isExtglob(str)) {
    return true;
  }

  var check = strictCheck;

  // optionally relax check
  if (options && options.strict === false) {
    check = relaxedCheck;
  }

  return check(str);
};

var isGlob = isGlob$1;
var pathPosixDirname = require$$0$4.posix.dirname;
var isWin32 = require$$2.platform() === 'win32';

var slash$1 = '/';
var backslash = /\\/g;
var enclosure = /[\{\[].*[\}\]]$/;
var globby$1 = /(^|[^\\])([\{\[]|\([^\)]+$)/;
var escaped = /\\([\!\*\?\|\[\]\(\)\{\}])/g;

/**
 * @param {string} str
 * @param {Object} opts
 * @param {boolean} [opts.flipBackslashes=true]
 * @returns {string}
 */
var globParent$1 = function globParent(str, opts) {
  var options = Object.assign({ flipBackslashes: true }, opts);

  // flip windows path separators
  if (options.flipBackslashes && isWin32 && str.indexOf(slash$1) < 0) {
    str = str.replace(backslash, slash$1);
  }

  // special case for strings ending in enclosure containing path separator
  if (enclosure.test(str)) {
    str += slash$1;
  }

  // preserves full path in case of trailing path separator
  str += 'a';

  // remove path parts that are globby
  do {
    str = pathPosixDirname(str);
  } while (isGlob(str) || globby$1.test(str));

  // remove escape chars and return result
  return str.replace(escaped, '$1');
};

var utils$j = {};

(function (exports) {

exports.isInteger = num => {
  if (typeof num === 'number') {
    return Number.isInteger(num);
  }
  if (typeof num === 'string' && num.trim() !== '') {
    return Number.isInteger(Number(num));
  }
  return false;
};

/**
 * Find a node of the given type
 */

exports.find = (node, type) => node.nodes.find(node => node.type === type);

/**
 * Find a node of the given type
 */

exports.exceedsLimit = (min, max, step = 1, limit) => {
  if (limit === false) return false;
  if (!exports.isInteger(min) || !exports.isInteger(max)) return false;
  return ((Number(max) - Number(min)) / Number(step)) >= limit;
};

/**
 * Escape the given node with '\\' before node.value
 */

exports.escapeNode = (block, n = 0, type) => {
  let node = block.nodes[n];
  if (!node) return;

  if ((type && node.type === type) || node.type === 'open' || node.type === 'close') {
    if (node.escaped !== true) {
      node.value = '\\' + node.value;
      node.escaped = true;
    }
  }
};

/**
 * Returns true if the given brace node should be enclosed in literal braces
 */

exports.encloseBrace = node => {
  if (node.type !== 'brace') return false;
  if ((node.commas >> 0 + node.ranges >> 0) === 0) {
    node.invalid = true;
    return true;
  }
  return false;
};

/**
 * Returns true if a brace node is invalid.
 */

exports.isInvalidBrace = block => {
  if (block.type !== 'brace') return false;
  if (block.invalid === true || block.dollar) return true;
  if ((block.commas >> 0 + block.ranges >> 0) === 0) {
    block.invalid = true;
    return true;
  }
  if (block.open !== true || block.close !== true) {
    block.invalid = true;
    return true;
  }
  return false;
};

/**
 * Returns true if a node is an open or close node
 */

exports.isOpenOrClose = node => {
  if (node.type === 'open' || node.type === 'close') {
    return true;
  }
  return node.open === true || node.close === true;
};

/**
 * Reduce an array of text nodes.
 */

exports.reduce = nodes => nodes.reduce((acc, node) => {
  if (node.type === 'text') acc.push(node.value);
  if (node.type === 'range') node.type = 'text';
  return acc;
}, []);

/**
 * Flatten an array
 */

exports.flatten = (...args) => {
  const result = [];
  const flat = arr => {
    for (let i = 0; i < arr.length; i++) {
      let ele = arr[i];
      Array.isArray(ele) ? flat(ele) : ele !== void 0 && result.push(ele);
    }
    return result;
  };
  flat(args);
  return result;
};
}(utils$j));

const utils$i = utils$j;

var stringify$4 = (ast, options = {}) => {
  let stringify = (node, parent = {}) => {
    let invalidBlock = options.escapeInvalid && utils$i.isInvalidBrace(parent);
    let invalidNode = node.invalid === true && options.escapeInvalid === true;
    let output = '';

    if (node.value) {
      if ((invalidBlock || invalidNode) && utils$i.isOpenOrClose(node)) {
        return '\\' + node.value;
      }
      return node.value;
    }

    if (node.value) {
      return node.value;
    }

    if (node.nodes) {
      for (let child of node.nodes) {
        output += stringify(child);
      }
    }
    return output;
  };

  return stringify(ast);
};

/*!
 * is-number <https://github.com/jonschlinkert/is-number>
 *
 * Copyright (c) 2014-present, Jon Schlinkert.
 * Released under the MIT License.
 */

var isNumber$2 = function(num) {
  if (typeof num === 'number') {
    return num - num === 0;
  }
  if (typeof num === 'string' && num.trim() !== '') {
    return Number.isFinite ? Number.isFinite(+num) : isFinite(+num);
  }
  return false;
};

/*!
 * to-regex-range <https://github.com/micromatch/to-regex-range>
 *
 * Copyright (c) 2015-present, Jon Schlinkert.
 * Released under the MIT License.
 */

const isNumber$1 = isNumber$2;

const toRegexRange$1 = (min, max, options) => {
  if (isNumber$1(min) === false) {
    throw new TypeError('toRegexRange: expected the first argument to be a number');
  }

  if (max === void 0 || min === max) {
    return String(min);
  }

  if (isNumber$1(max) === false) {
    throw new TypeError('toRegexRange: expected the second argument to be a number.');
  }

  let opts = { relaxZeros: true, ...options };
  if (typeof opts.strictZeros === 'boolean') {
    opts.relaxZeros = opts.strictZeros === false;
  }

  let relax = String(opts.relaxZeros);
  let shorthand = String(opts.shorthand);
  let capture = String(opts.capture);
  let wrap = String(opts.wrap);
  let cacheKey = min + ':' + max + '=' + relax + shorthand + capture + wrap;

  if (toRegexRange$1.cache.hasOwnProperty(cacheKey)) {
    return toRegexRange$1.cache[cacheKey].result;
  }

  let a = Math.min(min, max);
  let b = Math.max(min, max);

  if (Math.abs(a - b) === 1) {
    let result = min + '|' + max;
    if (opts.capture) {
      return `(${result})`;
    }
    if (opts.wrap === false) {
      return result;
    }
    return `(?:${result})`;
  }

  let isPadded = hasPadding(min) || hasPadding(max);
  let state = { min, max, a, b };
  let positives = [];
  let negatives = [];

  if (isPadded) {
    state.isPadded = isPadded;
    state.maxLen = String(state.max).length;
  }

  if (a < 0) {
    let newMin = b < 0 ? Math.abs(b) : 1;
    negatives = splitToPatterns(newMin, Math.abs(a), state, opts);
    a = state.a = 0;
  }

  if (b >= 0) {
    positives = splitToPatterns(a, b, state, opts);
  }

  state.negatives = negatives;
  state.positives = positives;
  state.result = collatePatterns(negatives, positives);

  if (opts.capture === true) {
    state.result = `(${state.result})`;
  } else if (opts.wrap !== false && (positives.length + negatives.length) > 1) {
    state.result = `(?:${state.result})`;
  }

  toRegexRange$1.cache[cacheKey] = state;
  return state.result;
};

function collatePatterns(neg, pos, options) {
  let onlyNegative = filterPatterns(neg, pos, '-', false) || [];
  let onlyPositive = filterPatterns(pos, neg, '', false) || [];
  let intersected = filterPatterns(neg, pos, '-?', true) || [];
  let subpatterns = onlyNegative.concat(intersected).concat(onlyPositive);
  return subpatterns.join('|');
}

function splitToRanges(min, max) {
  let nines = 1;
  let zeros = 1;

  let stop = countNines(min, nines);
  let stops = new Set([max]);

  while (min <= stop && stop <= max) {
    stops.add(stop);
    nines += 1;
    stop = countNines(min, nines);
  }

  stop = countZeros(max + 1, zeros) - 1;

  while (min < stop && stop <= max) {
    stops.add(stop);
    zeros += 1;
    stop = countZeros(max + 1, zeros) - 1;
  }

  stops = [...stops];
  stops.sort(compare);
  return stops;
}

/**
 * Convert a range to a regex pattern
 * @param {Number} `start`
 * @param {Number} `stop`
 * @return {String}
 */

function rangeToPattern(start, stop, options) {
  if (start === stop) {
    return { pattern: start, count: [], digits: 0 };
  }

  let zipped = zip(start, stop);
  let digits = zipped.length;
  let pattern = '';
  let count = 0;

  for (let i = 0; i < digits; i++) {
    let [startDigit, stopDigit] = zipped[i];

    if (startDigit === stopDigit) {
      pattern += startDigit;

    } else if (startDigit !== '0' || stopDigit !== '9') {
      pattern += toCharacterClass(startDigit, stopDigit);

    } else {
      count++;
    }
  }

  if (count) {
    pattern += options.shorthand === true ? '\\d' : '[0-9]';
  }

  return { pattern, count: [count], digits };
}

function splitToPatterns(min, max, tok, options) {
  let ranges = splitToRanges(min, max);
  let tokens = [];
  let start = min;
  let prev;

  for (let i = 0; i < ranges.length; i++) {
    let max = ranges[i];
    let obj = rangeToPattern(String(start), String(max), options);
    let zeros = '';

    if (!tok.isPadded && prev && prev.pattern === obj.pattern) {
      if (prev.count.length > 1) {
        prev.count.pop();
      }

      prev.count.push(obj.count[0]);
      prev.string = prev.pattern + toQuantifier(prev.count);
      start = max + 1;
      continue;
    }

    if (tok.isPadded) {
      zeros = padZeros(max, tok, options);
    }

    obj.string = zeros + obj.pattern + toQuantifier(obj.count);
    tokens.push(obj);
    start = max + 1;
    prev = obj;
  }

  return tokens;
}

function filterPatterns(arr, comparison, prefix, intersection, options) {
  let result = [];

  for (let ele of arr) {
    let { string } = ele;

    // only push if _both_ are negative...
    if (!intersection && !contains(comparison, 'string', string)) {
      result.push(prefix + string);
    }

    // or _both_ are positive
    if (intersection && contains(comparison, 'string', string)) {
      result.push(prefix + string);
    }
  }
  return result;
}

/**
 * Zip strings
 */

function zip(a, b) {
  let arr = [];
  for (let i = 0; i < a.length; i++) arr.push([a[i], b[i]]);
  return arr;
}

function compare(a, b) {
  return a > b ? 1 : b > a ? -1 : 0;
}

function contains(arr, key, val) {
  return arr.some(ele => ele[key] === val);
}

function countNines(min, len) {
  return Number(String(min).slice(0, -len) + '9'.repeat(len));
}

function countZeros(integer, zeros) {
  return integer - (integer % Math.pow(10, zeros));
}

function toQuantifier(digits) {
  let [start = 0, stop = ''] = digits;
  if (stop || start > 1) {
    return `{${start + (stop ? ',' + stop : '')}}`;
  }
  return '';
}

function toCharacterClass(a, b, options) {
  return `[${a}${(b - a === 1) ? '' : '-'}${b}]`;
}

function hasPadding(str) {
  return /^-?(0+)\d/.test(str);
}

function padZeros(value, tok, options) {
  if (!tok.isPadded) {
    return value;
  }

  let diff = Math.abs(tok.maxLen - String(value).length);
  let relax = options.relaxZeros !== false;

  switch (diff) {
    case 0:
      return '';
    case 1:
      return relax ? '0?' : '0';
    case 2:
      return relax ? '0{0,2}' : '00';
    default: {
      return relax ? `0{0,${diff}}` : `0{${diff}}`;
    }
  }
}

/**
 * Cache
 */

toRegexRange$1.cache = {};
toRegexRange$1.clearCache = () => (toRegexRange$1.cache = {});

/**
 * Expose `toRegexRange`
 */

var toRegexRange_1 = toRegexRange$1;

/*!
 * fill-range <https://github.com/jonschlinkert/fill-range>
 *
 * Copyright (c) 2014-present, Jon Schlinkert.
 * Licensed under the MIT License.
 */

const util$1 = require$$0$3;
const toRegexRange = toRegexRange_1;

const isObject$1 = val => val !== null && typeof val === 'object' && !Array.isArray(val);

const transform$1 = toNumber => {
  return value => toNumber === true ? Number(value) : String(value);
};

const isValidValue = value => {
  return typeof value === 'number' || (typeof value === 'string' && value !== '');
};

const isNumber = num => Number.isInteger(+num);

const zeros = input => {
  let value = `${input}`;
  let index = -1;
  if (value[0] === '-') value = value.slice(1);
  if (value === '0') return false;
  while (value[++index] === '0');
  return index > 0;
};

const stringify$3 = (start, end, options) => {
  if (typeof start === 'string' || typeof end === 'string') {
    return true;
  }
  return options.stringify === true;
};

const pad = (input, maxLength, toNumber) => {
  if (maxLength > 0) {
    let dash = input[0] === '-' ? '-' : '';
    if (dash) input = input.slice(1);
    input = (dash + input.padStart(dash ? maxLength - 1 : maxLength, '0'));
  }
  if (toNumber === false) {
    return String(input);
  }
  return input;
};

const toMaxLen = (input, maxLength) => {
  let negative = input[0] === '-' ? '-' : '';
  if (negative) {
    input = input.slice(1);
    maxLength--;
  }
  while (input.length < maxLength) input = '0' + input;
  return negative ? ('-' + input) : input;
};

const toSequence = (parts, options) => {
  parts.negatives.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
  parts.positives.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);

  let prefix = options.capture ? '' : '?:';
  let positives = '';
  let negatives = '';
  let result;

  if (parts.positives.length) {
    positives = parts.positives.join('|');
  }

  if (parts.negatives.length) {
    negatives = `-(${prefix}${parts.negatives.join('|')})`;
  }

  if (positives && negatives) {
    result = `${positives}|${negatives}`;
  } else {
    result = positives || negatives;
  }

  if (options.wrap) {
    return `(${prefix}${result})`;
  }

  return result;
};

const toRange = (a, b, isNumbers, options) => {
  if (isNumbers) {
    return toRegexRange(a, b, { wrap: false, ...options });
  }

  let start = String.fromCharCode(a);
  if (a === b) return start;

  let stop = String.fromCharCode(b);
  return `[${start}-${stop}]`;
};

const toRegex = (start, end, options) => {
  if (Array.isArray(start)) {
    let wrap = options.wrap === true;
    let prefix = options.capture ? '' : '?:';
    return wrap ? `(${prefix}${start.join('|')})` : start.join('|');
  }
  return toRegexRange(start, end, options);
};

const rangeError = (...args) => {
  return new RangeError('Invalid range arguments: ' + util$1.inspect(...args));
};

const invalidRange = (start, end, options) => {
  if (options.strictRanges === true) throw rangeError([start, end]);
  return [];
};

const invalidStep = (step, options) => {
  if (options.strictRanges === true) {
    throw new TypeError(`Expected step "${step}" to be a number`);
  }
  return [];
};

const fillNumbers = (start, end, step = 1, options = {}) => {
  let a = Number(start);
  let b = Number(end);

  if (!Number.isInteger(a) || !Number.isInteger(b)) {
    if (options.strictRanges === true) throw rangeError([start, end]);
    return [];
  }

  // fix negative zero
  if (a === 0) a = 0;
  if (b === 0) b = 0;

  let descending = a > b;
  let startString = String(start);
  let endString = String(end);
  let stepString = String(step);
  step = Math.max(Math.abs(step), 1);

  let padded = zeros(startString) || zeros(endString) || zeros(stepString);
  let maxLen = padded ? Math.max(startString.length, endString.length, stepString.length) : 0;
  let toNumber = padded === false && stringify$3(start, end, options) === false;
  let format = options.transform || transform$1(toNumber);

  if (options.toRegex && step === 1) {
    return toRange(toMaxLen(start, maxLen), toMaxLen(end, maxLen), true, options);
  }

  let parts = { negatives: [], positives: [] };
  let push = num => parts[num < 0 ? 'negatives' : 'positives'].push(Math.abs(num));
  let range = [];
  let index = 0;

  while (descending ? a >= b : a <= b) {
    if (options.toRegex === true && step > 1) {
      push(a);
    } else {
      range.push(pad(format(a, index), maxLen, toNumber));
    }
    a = descending ? a - step : a + step;
    index++;
  }

  if (options.toRegex === true) {
    return step > 1
      ? toSequence(parts, options)
      : toRegex(range, null, { wrap: false, ...options });
  }

  return range;
};

const fillLetters = (start, end, step = 1, options = {}) => {
  if ((!isNumber(start) && start.length > 1) || (!isNumber(end) && end.length > 1)) {
    return invalidRange(start, end, options);
  }


  let format = options.transform || (val => String.fromCharCode(val));
  let a = `${start}`.charCodeAt(0);
  let b = `${end}`.charCodeAt(0);

  let descending = a > b;
  let min = Math.min(a, b);
  let max = Math.max(a, b);

  if (options.toRegex && step === 1) {
    return toRange(min, max, false, options);
  }

  let range = [];
  let index = 0;

  while (descending ? a >= b : a <= b) {
    range.push(format(a, index));
    a = descending ? a - step : a + step;
    index++;
  }

  if (options.toRegex === true) {
    return toRegex(range, null, { wrap: false, options });
  }

  return range;
};

const fill$2 = (start, end, step, options = {}) => {
  if (end == null && isValidValue(start)) {
    return [start];
  }

  if (!isValidValue(start) || !isValidValue(end)) {
    return invalidRange(start, end, options);
  }

  if (typeof step === 'function') {
    return fill$2(start, end, 1, { transform: step });
  }

  if (isObject$1(step)) {
    return fill$2(start, end, 0, step);
  }

  let opts = { ...options };
  if (opts.capture === true) opts.wrap = true;
  step = step || opts.step || 1;

  if (!isNumber(step)) {
    if (step != null && !isObject$1(step)) return invalidStep(step, opts);
    return fill$2(start, end, 1, step);
  }

  if (isNumber(start) && isNumber(end)) {
    return fillNumbers(start, end, step, opts);
  }

  return fillLetters(start, end, Math.max(Math.abs(step), 1), opts);
};

var fillRange = fill$2;

const fill$1 = fillRange;
const utils$h = utils$j;

const compile$1 = (ast, options = {}) => {
  let walk = (node, parent = {}) => {
    let invalidBlock = utils$h.isInvalidBrace(parent);
    let invalidNode = node.invalid === true && options.escapeInvalid === true;
    let invalid = invalidBlock === true || invalidNode === true;
    let prefix = options.escapeInvalid === true ? '\\' : '';
    let output = '';

    if (node.isOpen === true) {
      return prefix + node.value;
    }
    if (node.isClose === true) {
      return prefix + node.value;
    }

    if (node.type === 'open') {
      return invalid ? (prefix + node.value) : '(';
    }

    if (node.type === 'close') {
      return invalid ? (prefix + node.value) : ')';
    }

    if (node.type === 'comma') {
      return node.prev.type === 'comma' ? '' : (invalid ? node.value : '|');
    }

    if (node.value) {
      return node.value;
    }

    if (node.nodes && node.ranges > 0) {
      let args = utils$h.reduce(node.nodes);
      let range = fill$1(...args, { ...options, wrap: false, toRegex: true });

      if (range.length !== 0) {
        return args.length > 1 && range.length > 1 ? `(${range})` : range;
      }
    }

    if (node.nodes) {
      for (let child of node.nodes) {
        output += walk(child, node);
      }
    }
    return output;
  };

  return walk(ast);
};

var compile_1 = compile$1;

const fill = fillRange;
const stringify$2 = stringify$4;
const utils$g = utils$j;

const append = (queue = '', stash = '', enclose = false) => {
  let result = [];

  queue = [].concat(queue);
  stash = [].concat(stash);

  if (!stash.length) return queue;
  if (!queue.length) {
    return enclose ? utils$g.flatten(stash).map(ele => `{${ele}}`) : stash;
  }

  for (let item of queue) {
    if (Array.isArray(item)) {
      for (let value of item) {
        result.push(append(value, stash, enclose));
      }
    } else {
      for (let ele of stash) {
        if (enclose === true && typeof ele === 'string') ele = `{${ele}}`;
        result.push(Array.isArray(ele) ? append(item, ele, enclose) : (item + ele));
      }
    }
  }
  return utils$g.flatten(result);
};

const expand$1 = (ast, options = {}) => {
  let rangeLimit = options.rangeLimit === void 0 ? 1000 : options.rangeLimit;

  let walk = (node, parent = {}) => {
    node.queue = [];

    let p = parent;
    let q = parent.queue;

    while (p.type !== 'brace' && p.type !== 'root' && p.parent) {
      p = p.parent;
      q = p.queue;
    }

    if (node.invalid || node.dollar) {
      q.push(append(q.pop(), stringify$2(node, options)));
      return;
    }

    if (node.type === 'brace' && node.invalid !== true && node.nodes.length === 2) {
      q.push(append(q.pop(), ['{}']));
      return;
    }

    if (node.nodes && node.ranges > 0) {
      let args = utils$g.reduce(node.nodes);

      if (utils$g.exceedsLimit(...args, options.step, rangeLimit)) {
        throw new RangeError('expanded array length exceeds range limit. Use options.rangeLimit to increase or disable the limit.');
      }

      let range = fill(...args, options);
      if (range.length === 0) {
        range = stringify$2(node, options);
      }

      q.push(append(q.pop(), range));
      node.nodes = [];
      return;
    }

    let enclose = utils$g.encloseBrace(node);
    let queue = node.queue;
    let block = node;

    while (block.type !== 'brace' && block.type !== 'root' && block.parent) {
      block = block.parent;
      queue = block.queue;
    }

    for (let i = 0; i < node.nodes.length; i++) {
      let child = node.nodes[i];

      if (child.type === 'comma' && node.type === 'brace') {
        if (i === 1) queue.push('');
        queue.push('');
        continue;
      }

      if (child.type === 'close') {
        q.push(append(q.pop(), queue, enclose));
        continue;
      }

      if (child.value && child.type !== 'open') {
        queue.push(append(queue.pop(), child.value));
        continue;
      }

      if (child.nodes) {
        walk(child, node);
      }
    }

    return queue;
  };

  return utils$g.flatten(walk(ast));
};

var expand_1 = expand$1;

var constants$4 = {
  MAX_LENGTH: 1024 * 64,

  // Digits
  CHAR_0: '0', /* 0 */
  CHAR_9: '9', /* 9 */

  // Alphabet chars.
  CHAR_UPPERCASE_A: 'A', /* A */
  CHAR_LOWERCASE_A: 'a', /* a */
  CHAR_UPPERCASE_Z: 'Z', /* Z */
  CHAR_LOWERCASE_Z: 'z', /* z */

  CHAR_LEFT_PARENTHESES: '(', /* ( */
  CHAR_RIGHT_PARENTHESES: ')', /* ) */

  CHAR_ASTERISK: '*', /* * */

  // Non-alphabetic chars.
  CHAR_AMPERSAND: '&', /* & */
  CHAR_AT: '@', /* @ */
  CHAR_BACKSLASH: '\\', /* \ */
  CHAR_BACKTICK: '`', /* ` */
  CHAR_CARRIAGE_RETURN: '\r', /* \r */
  CHAR_CIRCUMFLEX_ACCENT: '^', /* ^ */
  CHAR_COLON: ':', /* : */
  CHAR_COMMA: ',', /* , */
  CHAR_DOLLAR: '$', /* . */
  CHAR_DOT: '.', /* . */
  CHAR_DOUBLE_QUOTE: '"', /* " */
  CHAR_EQUAL: '=', /* = */
  CHAR_EXCLAMATION_MARK: '!', /* ! */
  CHAR_FORM_FEED: '\f', /* \f */
  CHAR_FORWARD_SLASH: '/', /* / */
  CHAR_HASH: '#', /* # */
  CHAR_HYPHEN_MINUS: '-', /* - */
  CHAR_LEFT_ANGLE_BRACKET: '<', /* < */
  CHAR_LEFT_CURLY_BRACE: '{', /* { */
  CHAR_LEFT_SQUARE_BRACKET: '[', /* [ */
  CHAR_LINE_FEED: '\n', /* \n */
  CHAR_NO_BREAK_SPACE: '\u00A0', /* \u00A0 */
  CHAR_PERCENT: '%', /* % */
  CHAR_PLUS: '+', /* + */
  CHAR_QUESTION_MARK: '?', /* ? */
  CHAR_RIGHT_ANGLE_BRACKET: '>', /* > */
  CHAR_RIGHT_CURLY_BRACE: '}', /* } */
  CHAR_RIGHT_SQUARE_BRACKET: ']', /* ] */
  CHAR_SEMICOLON: ';', /* ; */
  CHAR_SINGLE_QUOTE: '\'', /* ' */
  CHAR_SPACE: ' ', /*   */
  CHAR_TAB: '\t', /* \t */
  CHAR_UNDERSCORE: '_', /* _ */
  CHAR_VERTICAL_LINE: '|', /* | */
  CHAR_ZERO_WIDTH_NOBREAK_SPACE: '\uFEFF' /* \uFEFF */
};

const stringify$1 = stringify$4;

/**
 * Constants
 */

const {
  MAX_LENGTH: MAX_LENGTH$1,
  CHAR_BACKSLASH, /* \ */
  CHAR_BACKTICK, /* ` */
  CHAR_COMMA: CHAR_COMMA$1, /* , */
  CHAR_DOT: CHAR_DOT$1, /* . */
  CHAR_LEFT_PARENTHESES: CHAR_LEFT_PARENTHESES$1, /* ( */
  CHAR_RIGHT_PARENTHESES: CHAR_RIGHT_PARENTHESES$1, /* ) */
  CHAR_LEFT_CURLY_BRACE: CHAR_LEFT_CURLY_BRACE$1, /* { */
  CHAR_RIGHT_CURLY_BRACE: CHAR_RIGHT_CURLY_BRACE$1, /* } */
  CHAR_LEFT_SQUARE_BRACKET: CHAR_LEFT_SQUARE_BRACKET$1, /* [ */
  CHAR_RIGHT_SQUARE_BRACKET: CHAR_RIGHT_SQUARE_BRACKET$1, /* ] */
  CHAR_DOUBLE_QUOTE, /* " */
  CHAR_SINGLE_QUOTE, /* ' */
  CHAR_NO_BREAK_SPACE,
  CHAR_ZERO_WIDTH_NOBREAK_SPACE
} = constants$4;

/**
 * parse
 */

const parse$3 = (input, options = {}) => {
  if (typeof input !== 'string') {
    throw new TypeError('Expected a string');
  }

  let opts = options || {};
  let max = typeof opts.maxLength === 'number' ? Math.min(MAX_LENGTH$1, opts.maxLength) : MAX_LENGTH$1;
  if (input.length > max) {
    throw new SyntaxError(`Input length (${input.length}), exceeds max characters (${max})`);
  }

  let ast = { type: 'root', input, nodes: [] };
  let stack = [ast];
  let block = ast;
  let prev = ast;
  let brackets = 0;
  let length = input.length;
  let index = 0;
  let depth = 0;
  let value;

  /**
   * Helpers
   */

  const advance = () => input[index++];
  const push = node => {
    if (node.type === 'text' && prev.type === 'dot') {
      prev.type = 'text';
    }

    if (prev && prev.type === 'text' && node.type === 'text') {
      prev.value += node.value;
      return;
    }

    block.nodes.push(node);
    node.parent = block;
    node.prev = prev;
    prev = node;
    return node;
  };

  push({ type: 'bos' });

  while (index < length) {
    block = stack[stack.length - 1];
    value = advance();

    /**
     * Invalid chars
     */

    if (value === CHAR_ZERO_WIDTH_NOBREAK_SPACE || value === CHAR_NO_BREAK_SPACE) {
      continue;
    }

    /**
     * Escaped chars
     */

    if (value === CHAR_BACKSLASH) {
      push({ type: 'text', value: (options.keepEscaping ? value : '') + advance() });
      continue;
    }

    /**
     * Right square bracket (literal): ']'
     */

    if (value === CHAR_RIGHT_SQUARE_BRACKET$1) {
      push({ type: 'text', value: '\\' + value });
      continue;
    }

    /**
     * Left square bracket: '['
     */

    if (value === CHAR_LEFT_SQUARE_BRACKET$1) {
      brackets++;
      let next;

      while (index < length && (next = advance())) {
        value += next;

        if (next === CHAR_LEFT_SQUARE_BRACKET$1) {
          brackets++;
          continue;
        }

        if (next === CHAR_BACKSLASH) {
          value += advance();
          continue;
        }

        if (next === CHAR_RIGHT_SQUARE_BRACKET$1) {
          brackets--;

          if (brackets === 0) {
            break;
          }
        }
      }

      push({ type: 'text', value });
      continue;
    }

    /**
     * Parentheses
     */

    if (value === CHAR_LEFT_PARENTHESES$1) {
      block = push({ type: 'paren', nodes: [] });
      stack.push(block);
      push({ type: 'text', value });
      continue;
    }

    if (value === CHAR_RIGHT_PARENTHESES$1) {
      if (block.type !== 'paren') {
        push({ type: 'text', value });
        continue;
      }
      block = stack.pop();
      push({ type: 'text', value });
      block = stack[stack.length - 1];
      continue;
    }

    /**
     * Quotes: '|"|`
     */

    if (value === CHAR_DOUBLE_QUOTE || value === CHAR_SINGLE_QUOTE || value === CHAR_BACKTICK) {
      let open = value;
      let next;

      if (options.keepQuotes !== true) {
        value = '';
      }

      while (index < length && (next = advance())) {
        if (next === CHAR_BACKSLASH) {
          value += next + advance();
          continue;
        }

        if (next === open) {
          if (options.keepQuotes === true) value += next;
          break;
        }

        value += next;
      }

      push({ type: 'text', value });
      continue;
    }

    /**
     * Left curly brace: '{'
     */

    if (value === CHAR_LEFT_CURLY_BRACE$1) {
      depth++;

      let dollar = prev.value && prev.value.slice(-1) === '$' || block.dollar === true;
      let brace = {
        type: 'brace',
        open: true,
        close: false,
        dollar,
        depth,
        commas: 0,
        ranges: 0,
        nodes: []
      };

      block = push(brace);
      stack.push(block);
      push({ type: 'open', value });
      continue;
    }

    /**
     * Right curly brace: '}'
     */

    if (value === CHAR_RIGHT_CURLY_BRACE$1) {
      if (block.type !== 'brace') {
        push({ type: 'text', value });
        continue;
      }

      let type = 'close';
      block = stack.pop();
      block.close = true;

      push({ type, value });
      depth--;

      block = stack[stack.length - 1];
      continue;
    }

    /**
     * Comma: ','
     */

    if (value === CHAR_COMMA$1 && depth > 0) {
      if (block.ranges > 0) {
        block.ranges = 0;
        let open = block.nodes.shift();
        block.nodes = [open, { type: 'text', value: stringify$1(block) }];
      }

      push({ type: 'comma', value });
      block.commas++;
      continue;
    }

    /**
     * Dot: '.'
     */

    if (value === CHAR_DOT$1 && depth > 0 && block.commas === 0) {
      let siblings = block.nodes;

      if (depth === 0 || siblings.length === 0) {
        push({ type: 'text', value });
        continue;
      }

      if (prev.type === 'dot') {
        block.range = [];
        prev.value += value;
        prev.type = 'range';

        if (block.nodes.length !== 3 && block.nodes.length !== 5) {
          block.invalid = true;
          block.ranges = 0;
          prev.type = 'text';
          continue;
        }

        block.ranges++;
        block.args = [];
        continue;
      }

      if (prev.type === 'range') {
        siblings.pop();

        let before = siblings[siblings.length - 1];
        before.value += prev.value + value;
        prev = before;
        block.ranges--;
        continue;
      }

      push({ type: 'dot', value });
      continue;
    }

    /**
     * Text
     */

    push({ type: 'text', value });
  }

  // Mark imbalanced braces and brackets as invalid
  do {
    block = stack.pop();

    if (block.type !== 'root') {
      block.nodes.forEach(node => {
        if (!node.nodes) {
          if (node.type === 'open') node.isOpen = true;
          if (node.type === 'close') node.isClose = true;
          if (!node.nodes) node.type = 'text';
          node.invalid = true;
        }
      });

      // get the location of the block on parent.nodes (block's siblings)
      let parent = stack[stack.length - 1];
      let index = parent.nodes.indexOf(block);
      // replace the (invalid) block with it's nodes
      parent.nodes.splice(index, 1, ...block.nodes);
    }
  } while (stack.length > 0);

  push({ type: 'eos' });
  return ast;
};

var parse_1$1 = parse$3;

const stringify = stringify$4;
const compile = compile_1;
const expand = expand_1;
const parse$2 = parse_1$1;

/**
 * Expand the given pattern or create a regex-compatible string.
 *
 * ```js
 * const braces = require('braces');
 * console.log(braces('{a,b,c}', { compile: true })); //=> ['(a|b|c)']
 * console.log(braces('{a,b,c}')); //=> ['a', 'b', 'c']
 * ```
 * @param {String} `str`
 * @param {Object} `options`
 * @return {String}
 * @api public
 */

const braces$1 = (input, options = {}) => {
  let output = [];

  if (Array.isArray(input)) {
    for (let pattern of input) {
      let result = braces$1.create(pattern, options);
      if (Array.isArray(result)) {
        output.push(...result);
      } else {
        output.push(result);
      }
    }
  } else {
    output = [].concat(braces$1.create(input, options));
  }

  if (options && options.expand === true && options.nodupes === true) {
    output = [...new Set(output)];
  }
  return output;
};

/**
 * Parse the given `str` with the given `options`.
 *
 * ```js
 * // braces.parse(pattern, [, options]);
 * const ast = braces.parse('a/{b,c}/d');
 * console.log(ast);
 * ```
 * @param {String} pattern Brace pattern to parse
 * @param {Object} options
 * @return {Object} Returns an AST
 * @api public
 */

braces$1.parse = (input, options = {}) => parse$2(input, options);

/**
 * Creates a braces string from an AST, or an AST node.
 *
 * ```js
 * const braces = require('braces');
 * let ast = braces.parse('foo/{a,b}/bar');
 * console.log(stringify(ast.nodes[2])); //=> '{a,b}'
 * ```
 * @param {String} `input` Brace pattern or AST.
 * @param {Object} `options`
 * @return {Array} Returns an array of expanded values.
 * @api public
 */

braces$1.stringify = (input, options = {}) => {
  if (typeof input === 'string') {
    return stringify(braces$1.parse(input, options), options);
  }
  return stringify(input, options);
};

/**
 * Compiles a brace pattern into a regex-compatible, optimized string.
 * This method is called by the main [braces](#braces) function by default.
 *
 * ```js
 * const braces = require('braces');
 * console.log(braces.compile('a/{b,c}/d'));
 * //=> ['a/(b|c)/d']
 * ```
 * @param {String} `input` Brace pattern or AST.
 * @param {Object} `options`
 * @return {Array} Returns an array of expanded values.
 * @api public
 */

braces$1.compile = (input, options = {}) => {
  if (typeof input === 'string') {
    input = braces$1.parse(input, options);
  }
  return compile(input, options);
};

/**
 * Expands a brace pattern into an array. This method is called by the
 * main [braces](#braces) function when `options.expand` is true. Before
 * using this method it's recommended that you read the [performance notes](#performance))
 * and advantages of using [.compile](#compile) instead.
 *
 * ```js
 * const braces = require('braces');
 * console.log(braces.expand('a/{b,c}/d'));
 * //=> ['a/b/d', 'a/c/d'];
 * ```
 * @param {String} `pattern` Brace pattern
 * @param {Object} `options`
 * @return {Array} Returns an array of expanded values.
 * @api public
 */

braces$1.expand = (input, options = {}) => {
  if (typeof input === 'string') {
    input = braces$1.parse(input, options);
  }

  let result = expand(input, options);

  // filter out empty strings if specified
  if (options.noempty === true) {
    result = result.filter(Boolean);
  }

  // filter out duplicates if specified
  if (options.nodupes === true) {
    result = [...new Set(result)];
  }

  return result;
};

/**
 * Processes a brace pattern and returns either an expanded array
 * (if `options.expand` is true), a highly optimized regex-compatible string.
 * This method is called by the main [braces](#braces) function.
 *
 * ```js
 * const braces = require('braces');
 * console.log(braces.create('user-{200..300}/project-{a,b,c}-{1..10}'))
 * //=> 'user-(20[0-9]|2[1-9][0-9]|300)/project-(a|b|c)-([1-9]|10)'
 * ```
 * @param {String} `pattern` Brace pattern
 * @param {Object} `options`
 * @return {Array} Returns an array of expanded values.
 * @api public
 */

braces$1.create = (input, options = {}) => {
  if (input === '' || input.length < 3) {
    return [input];
  }

 return options.expand !== true
    ? braces$1.compile(input, options)
    : braces$1.expand(input, options);
};

/**
 * Expose "braces"
 */

var braces_1 = braces$1;

var utils$f = {};

const path$8 = require$$0$4;
const WIN_SLASH = '\\\\/';
const WIN_NO_SLASH = `[^${WIN_SLASH}]`;

/**
 * Posix glob regex
 */

const DOT_LITERAL = '\\.';
const PLUS_LITERAL = '\\+';
const QMARK_LITERAL = '\\?';
const SLASH_LITERAL = '\\/';
const ONE_CHAR = '(?=.)';
const QMARK = '[^/]';
const END_ANCHOR = `(?:${SLASH_LITERAL}|$)`;
const START_ANCHOR = `(?:^|${SLASH_LITERAL})`;
const DOTS_SLASH = `${DOT_LITERAL}{1,2}${END_ANCHOR}`;
const NO_DOT = `(?!${DOT_LITERAL})`;
const NO_DOTS = `(?!${START_ANCHOR}${DOTS_SLASH})`;
const NO_DOT_SLASH = `(?!${DOT_LITERAL}{0,1}${END_ANCHOR})`;
const NO_DOTS_SLASH = `(?!${DOTS_SLASH})`;
const QMARK_NO_DOT = `[^.${SLASH_LITERAL}]`;
const STAR = `${QMARK}*?`;

const POSIX_CHARS = {
  DOT_LITERAL,
  PLUS_LITERAL,
  QMARK_LITERAL,
  SLASH_LITERAL,
  ONE_CHAR,
  QMARK,
  END_ANCHOR,
  DOTS_SLASH,
  NO_DOT,
  NO_DOTS,
  NO_DOT_SLASH,
  NO_DOTS_SLASH,
  QMARK_NO_DOT,
  STAR,
  START_ANCHOR
};

/**
 * Windows glob regex
 */

const WINDOWS_CHARS = {
  ...POSIX_CHARS,

  SLASH_LITERAL: `[${WIN_SLASH}]`,
  QMARK: WIN_NO_SLASH,
  STAR: `${WIN_NO_SLASH}*?`,
  DOTS_SLASH: `${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$)`,
  NO_DOT: `(?!${DOT_LITERAL})`,
  NO_DOTS: `(?!(?:^|[${WIN_SLASH}])${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
  NO_DOT_SLASH: `(?!${DOT_LITERAL}{0,1}(?:[${WIN_SLASH}]|$))`,
  NO_DOTS_SLASH: `(?!${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
  QMARK_NO_DOT: `[^.${WIN_SLASH}]`,
  START_ANCHOR: `(?:^|[${WIN_SLASH}])`,
  END_ANCHOR: `(?:[${WIN_SLASH}]|$)`
};

/**
 * POSIX Bracket Regex
 */

const POSIX_REGEX_SOURCE$1 = {
  alnum: 'a-zA-Z0-9',
  alpha: 'a-zA-Z',
  ascii: '\\x00-\\x7F',
  blank: ' \\t',
  cntrl: '\\x00-\\x1F\\x7F',
  digit: '0-9',
  graph: '\\x21-\\x7E',
  lower: 'a-z',
  print: '\\x20-\\x7E ',
  punct: '\\-!"#$%&\'()\\*+,./:;<=>?@[\\]^_`{|}~',
  space: ' \\t\\r\\n\\v\\f',
  upper: 'A-Z',
  word: 'A-Za-z0-9_',
  xdigit: 'A-Fa-f0-9'
};

var constants$3 = {
  MAX_LENGTH: 1024 * 64,
  POSIX_REGEX_SOURCE: POSIX_REGEX_SOURCE$1,

  // regular expressions
  REGEX_BACKSLASH: /\\(?![*+?^${}(|)[\]])/g,
  REGEX_NON_SPECIAL_CHARS: /^[^@![\].,$*+?^{}()|\\/]+/,
  REGEX_SPECIAL_CHARS: /[-*+?.^${}(|)[\]]/,
  REGEX_SPECIAL_CHARS_BACKREF: /(\\?)((\W)(\3*))/g,
  REGEX_SPECIAL_CHARS_GLOBAL: /([-*+?.^${}(|)[\]])/g,
  REGEX_REMOVE_BACKSLASH: /(?:\[.*?[^\\]\]|\\(?=.))/g,

  // Replace globs with equivalent patterns to reduce parsing time.
  REPLACEMENTS: {
    '***': '*',
    '**/**': '**',
    '**/**/**': '**'
  },

  // Digits
  CHAR_0: 48, /* 0 */
  CHAR_9: 57, /* 9 */

  // Alphabet chars.
  CHAR_UPPERCASE_A: 65, /* A */
  CHAR_LOWERCASE_A: 97, /* a */
  CHAR_UPPERCASE_Z: 90, /* Z */
  CHAR_LOWERCASE_Z: 122, /* z */

  CHAR_LEFT_PARENTHESES: 40, /* ( */
  CHAR_RIGHT_PARENTHESES: 41, /* ) */

  CHAR_ASTERISK: 42, /* * */

  // Non-alphabetic chars.
  CHAR_AMPERSAND: 38, /* & */
  CHAR_AT: 64, /* @ */
  CHAR_BACKWARD_SLASH: 92, /* \ */
  CHAR_CARRIAGE_RETURN: 13, /* \r */
  CHAR_CIRCUMFLEX_ACCENT: 94, /* ^ */
  CHAR_COLON: 58, /* : */
  CHAR_COMMA: 44, /* , */
  CHAR_DOT: 46, /* . */
  CHAR_DOUBLE_QUOTE: 34, /* " */
  CHAR_EQUAL: 61, /* = */
  CHAR_EXCLAMATION_MARK: 33, /* ! */
  CHAR_FORM_FEED: 12, /* \f */
  CHAR_FORWARD_SLASH: 47, /* / */
  CHAR_GRAVE_ACCENT: 96, /* ` */
  CHAR_HASH: 35, /* # */
  CHAR_HYPHEN_MINUS: 45, /* - */
  CHAR_LEFT_ANGLE_BRACKET: 60, /* < */
  CHAR_LEFT_CURLY_BRACE: 123, /* { */
  CHAR_LEFT_SQUARE_BRACKET: 91, /* [ */
  CHAR_LINE_FEED: 10, /* \n */
  CHAR_NO_BREAK_SPACE: 160, /* \u00A0 */
  CHAR_PERCENT: 37, /* % */
  CHAR_PLUS: 43, /* + */
  CHAR_QUESTION_MARK: 63, /* ? */
  CHAR_RIGHT_ANGLE_BRACKET: 62, /* > */
  CHAR_RIGHT_CURLY_BRACE: 125, /* } */
  CHAR_RIGHT_SQUARE_BRACKET: 93, /* ] */
  CHAR_SEMICOLON: 59, /* ; */
  CHAR_SINGLE_QUOTE: 39, /* ' */
  CHAR_SPACE: 32, /*   */
  CHAR_TAB: 9, /* \t */
  CHAR_UNDERSCORE: 95, /* _ */
  CHAR_VERTICAL_LINE: 124, /* | */
  CHAR_ZERO_WIDTH_NOBREAK_SPACE: 65279, /* \uFEFF */

  SEP: path$8.sep,

  /**
   * Create EXTGLOB_CHARS
   */

  extglobChars(chars) {
    return {
      '!': { type: 'negate', open: '(?:(?!(?:', close: `))${chars.STAR})` },
      '?': { type: 'qmark', open: '(?:', close: ')?' },
      '+': { type: 'plus', open: '(?:', close: ')+' },
      '*': { type: 'star', open: '(?:', close: ')*' },
      '@': { type: 'at', open: '(?:', close: ')' }
    };
  },

  /**
   * Create GLOB_CHARS
   */

  globChars(win32) {
    return win32 === true ? WINDOWS_CHARS : POSIX_CHARS;
  }
};

(function (exports) {

const path = require$$0$4;
const win32 = process.platform === 'win32';
const {
  REGEX_BACKSLASH,
  REGEX_REMOVE_BACKSLASH,
  REGEX_SPECIAL_CHARS,
  REGEX_SPECIAL_CHARS_GLOBAL
} = constants$3;

exports.isObject = val => val !== null && typeof val === 'object' && !Array.isArray(val);
exports.hasRegexChars = str => REGEX_SPECIAL_CHARS.test(str);
exports.isRegexChar = str => str.length === 1 && exports.hasRegexChars(str);
exports.escapeRegex = str => str.replace(REGEX_SPECIAL_CHARS_GLOBAL, '\\$1');
exports.toPosixSlashes = str => str.replace(REGEX_BACKSLASH, '/');

exports.removeBackslashes = str => {
  return str.replace(REGEX_REMOVE_BACKSLASH, match => {
    return match === '\\' ? '' : match;
  });
};

exports.supportsLookbehinds = () => {
  const segs = process.version.slice(1).split('.').map(Number);
  if (segs.length === 3 && segs[0] >= 9 || (segs[0] === 8 && segs[1] >= 10)) {
    return true;
  }
  return false;
};

exports.isWindows = options => {
  if (options && typeof options.windows === 'boolean') {
    return options.windows;
  }
  return win32 === true || path.sep === '\\';
};

exports.escapeLast = (input, char, lastIdx) => {
  const idx = input.lastIndexOf(char, lastIdx);
  if (idx === -1) return input;
  if (input[idx - 1] === '\\') return exports.escapeLast(input, char, idx - 1);
  return `${input.slice(0, idx)}\\${input.slice(idx)}`;
};

exports.removePrefix = (input, state = {}) => {
  let output = input;
  if (output.startsWith('./')) {
    output = output.slice(2);
    state.prefix = './';
  }
  return output;
};

exports.wrapOutput = (input, state = {}, options = {}) => {
  const prepend = options.contains ? '' : '^';
  const append = options.contains ? '' : '$';

  let output = `${prepend}(?:${input})${append}`;
  if (state.negated === true) {
    output = `(?:^(?!${output}).*$)`;
  }
  return output;
};
}(utils$f));

const utils$e = utils$f;
const {
  CHAR_ASTERISK,             /* * */
  CHAR_AT,                   /* @ */
  CHAR_BACKWARD_SLASH,       /* \ */
  CHAR_COMMA,                /* , */
  CHAR_DOT,                  /* . */
  CHAR_EXCLAMATION_MARK,     /* ! */
  CHAR_FORWARD_SLASH,        /* / */
  CHAR_LEFT_CURLY_BRACE,     /* { */
  CHAR_LEFT_PARENTHESES,     /* ( */
  CHAR_LEFT_SQUARE_BRACKET,  /* [ */
  CHAR_PLUS,                 /* + */
  CHAR_QUESTION_MARK,        /* ? */
  CHAR_RIGHT_CURLY_BRACE,    /* } */
  CHAR_RIGHT_PARENTHESES,    /* ) */
  CHAR_RIGHT_SQUARE_BRACKET  /* ] */
} = constants$3;

const isPathSeparator = code => {
  return code === CHAR_FORWARD_SLASH || code === CHAR_BACKWARD_SLASH;
};

const depth = token => {
  if (token.isPrefix !== true) {
    token.depth = token.isGlobstar ? Infinity : 1;
  }
};

/**
 * Quickly scans a glob pattern and returns an object with a handful of
 * useful properties, like `isGlob`, `path` (the leading non-glob, if it exists),
 * `glob` (the actual pattern), `negated` (true if the path starts with `!` but not
 * with `!(`) and `negatedExtglob` (true if the path starts with `!(`).
 *
 * ```js
 * const pm = require('picomatch');
 * console.log(pm.scan('foo/bar/*.js'));
 * { isGlob: true, input: 'foo/bar/*.js', base: 'foo/bar', glob: '*.js' }
 * ```
 * @param {String} `str`
 * @param {Object} `options`
 * @return {Object} Returns an object with tokens and regex source string.
 * @api public
 */

const scan$1 = (input, options) => {
  const opts = options || {};

  const length = input.length - 1;
  const scanToEnd = opts.parts === true || opts.scanToEnd === true;
  const slashes = [];
  const tokens = [];
  const parts = [];

  let str = input;
  let index = -1;
  let start = 0;
  let lastIndex = 0;
  let isBrace = false;
  let isBracket = false;
  let isGlob = false;
  let isExtglob = false;
  let isGlobstar = false;
  let braceEscaped = false;
  let backslashes = false;
  let negated = false;
  let negatedExtglob = false;
  let finished = false;
  let braces = 0;
  let prev;
  let code;
  let token = { value: '', depth: 0, isGlob: false };

  const eos = () => index >= length;
  const peek = () => str.charCodeAt(index + 1);
  const advance = () => {
    prev = code;
    return str.charCodeAt(++index);
  };

  while (index < length) {
    code = advance();
    let next;

    if (code === CHAR_BACKWARD_SLASH) {
      backslashes = token.backslashes = true;
      code = advance();

      if (code === CHAR_LEFT_CURLY_BRACE) {
        braceEscaped = true;
      }
      continue;
    }

    if (braceEscaped === true || code === CHAR_LEFT_CURLY_BRACE) {
      braces++;

      while (eos() !== true && (code = advance())) {
        if (code === CHAR_BACKWARD_SLASH) {
          backslashes = token.backslashes = true;
          advance();
          continue;
        }

        if (code === CHAR_LEFT_CURLY_BRACE) {
          braces++;
          continue;
        }

        if (braceEscaped !== true && code === CHAR_DOT && (code = advance()) === CHAR_DOT) {
          isBrace = token.isBrace = true;
          isGlob = token.isGlob = true;
          finished = true;

          if (scanToEnd === true) {
            continue;
          }

          break;
        }

        if (braceEscaped !== true && code === CHAR_COMMA) {
          isBrace = token.isBrace = true;
          isGlob = token.isGlob = true;
          finished = true;

          if (scanToEnd === true) {
            continue;
          }

          break;
        }

        if (code === CHAR_RIGHT_CURLY_BRACE) {
          braces--;

          if (braces === 0) {
            braceEscaped = false;
            isBrace = token.isBrace = true;
            finished = true;
            break;
          }
        }
      }

      if (scanToEnd === true) {
        continue;
      }

      break;
    }

    if (code === CHAR_FORWARD_SLASH) {
      slashes.push(index);
      tokens.push(token);
      token = { value: '', depth: 0, isGlob: false };

      if (finished === true) continue;
      if (prev === CHAR_DOT && index === (start + 1)) {
        start += 2;
        continue;
      }

      lastIndex = index + 1;
      continue;
    }

    if (opts.noext !== true) {
      const isExtglobChar = code === CHAR_PLUS
        || code === CHAR_AT
        || code === CHAR_ASTERISK
        || code === CHAR_QUESTION_MARK
        || code === CHAR_EXCLAMATION_MARK;

      if (isExtglobChar === true && peek() === CHAR_LEFT_PARENTHESES) {
        isGlob = token.isGlob = true;
        isExtglob = token.isExtglob = true;
        finished = true;
        if (code === CHAR_EXCLAMATION_MARK && index === start) {
          negatedExtglob = true;
        }

        if (scanToEnd === true) {
          while (eos() !== true && (code = advance())) {
            if (code === CHAR_BACKWARD_SLASH) {
              backslashes = token.backslashes = true;
              code = advance();
              continue;
            }

            if (code === CHAR_RIGHT_PARENTHESES) {
              isGlob = token.isGlob = true;
              finished = true;
              break;
            }
          }
          continue;
        }
        break;
      }
    }

    if (code === CHAR_ASTERISK) {
      if (prev === CHAR_ASTERISK) isGlobstar = token.isGlobstar = true;
      isGlob = token.isGlob = true;
      finished = true;

      if (scanToEnd === true) {
        continue;
      }
      break;
    }

    if (code === CHAR_QUESTION_MARK) {
      isGlob = token.isGlob = true;
      finished = true;

      if (scanToEnd === true) {
        continue;
      }
      break;
    }

    if (code === CHAR_LEFT_SQUARE_BRACKET) {
      while (eos() !== true && (next = advance())) {
        if (next === CHAR_BACKWARD_SLASH) {
          backslashes = token.backslashes = true;
          advance();
          continue;
        }

        if (next === CHAR_RIGHT_SQUARE_BRACKET) {
          isBracket = token.isBracket = true;
          isGlob = token.isGlob = true;
          finished = true;
          break;
        }
      }

      if (scanToEnd === true) {
        continue;
      }

      break;
    }

    if (opts.nonegate !== true && code === CHAR_EXCLAMATION_MARK && index === start) {
      negated = token.negated = true;
      start++;
      continue;
    }

    if (opts.noparen !== true && code === CHAR_LEFT_PARENTHESES) {
      isGlob = token.isGlob = true;

      if (scanToEnd === true) {
        while (eos() !== true && (code = advance())) {
          if (code === CHAR_LEFT_PARENTHESES) {
            backslashes = token.backslashes = true;
            code = advance();
            continue;
          }

          if (code === CHAR_RIGHT_PARENTHESES) {
            finished = true;
            break;
          }
        }
        continue;
      }
      break;
    }

    if (isGlob === true) {
      finished = true;

      if (scanToEnd === true) {
        continue;
      }

      break;
    }
  }

  if (opts.noext === true) {
    isExtglob = false;
    isGlob = false;
  }

  let base = str;
  let prefix = '';
  let glob = '';

  if (start > 0) {
    prefix = str.slice(0, start);
    str = str.slice(start);
    lastIndex -= start;
  }

  if (base && isGlob === true && lastIndex > 0) {
    base = str.slice(0, lastIndex);
    glob = str.slice(lastIndex);
  } else if (isGlob === true) {
    base = '';
    glob = str;
  } else {
    base = str;
  }

  if (base && base !== '' && base !== '/' && base !== str) {
    if (isPathSeparator(base.charCodeAt(base.length - 1))) {
      base = base.slice(0, -1);
    }
  }

  if (opts.unescape === true) {
    if (glob) glob = utils$e.removeBackslashes(glob);

    if (base && backslashes === true) {
      base = utils$e.removeBackslashes(base);
    }
  }

  const state = {
    prefix,
    input,
    start,
    base,
    glob,
    isBrace,
    isBracket,
    isGlob,
    isExtglob,
    isGlobstar,
    negated,
    negatedExtglob
  };

  if (opts.tokens === true) {
    state.maxDepth = 0;
    if (!isPathSeparator(code)) {
      tokens.push(token);
    }
    state.tokens = tokens;
  }

  if (opts.parts === true || opts.tokens === true) {
    let prevIndex;

    for (let idx = 0; idx < slashes.length; idx++) {
      const n = prevIndex ? prevIndex + 1 : start;
      const i = slashes[idx];
      const value = input.slice(n, i);
      if (opts.tokens) {
        if (idx === 0 && start !== 0) {
          tokens[idx].isPrefix = true;
          tokens[idx].value = prefix;
        } else {
          tokens[idx].value = value;
        }
        depth(tokens[idx]);
        state.maxDepth += tokens[idx].depth;
      }
      if (idx !== 0 || value !== '') {
        parts.push(value);
      }
      prevIndex = i;
    }

    if (prevIndex && prevIndex + 1 < input.length) {
      const value = input.slice(prevIndex + 1);
      parts.push(value);

      if (opts.tokens) {
        tokens[tokens.length - 1].value = value;
        depth(tokens[tokens.length - 1]);
        state.maxDepth += tokens[tokens.length - 1].depth;
      }
    }

    state.slashes = slashes;
    state.parts = parts;
  }

  return state;
};

var scan_1 = scan$1;

const constants$2 = constants$3;
const utils$d = utils$f;

/**
 * Constants
 */

const {
  MAX_LENGTH,
  POSIX_REGEX_SOURCE,
  REGEX_NON_SPECIAL_CHARS,
  REGEX_SPECIAL_CHARS_BACKREF,
  REPLACEMENTS
} = constants$2;

/**
 * Helpers
 */

const expandRange = (args, options) => {
  if (typeof options.expandRange === 'function') {
    return options.expandRange(...args, options);
  }

  args.sort();
  const value = `[${args.join('-')}]`;

  try {
    /* eslint-disable-next-line no-new */
    new RegExp(value);
  } catch (ex) {
    return args.map(v => utils$d.escapeRegex(v)).join('..');
  }

  return value;
};

/**
 * Create the message for a syntax error
 */

const syntaxError = (type, char) => {
  return `Missing ${type}: "${char}" - use "\\\\${char}" to match literal characters`;
};

/**
 * Parse the given input string.
 * @param {String} input
 * @param {Object} options
 * @return {Object}
 */

const parse$1 = (input, options) => {
  if (typeof input !== 'string') {
    throw new TypeError('Expected a string');
  }

  input = REPLACEMENTS[input] || input;

  const opts = { ...options };
  const max = typeof opts.maxLength === 'number' ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;

  let len = input.length;
  if (len > max) {
    throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
  }

  const bos = { type: 'bos', value: '', output: opts.prepend || '' };
  const tokens = [bos];

  const capture = opts.capture ? '' : '?:';
  const win32 = utils$d.isWindows(options);

  // create constants based on platform, for windows or posix
  const PLATFORM_CHARS = constants$2.globChars(win32);
  const EXTGLOB_CHARS = constants$2.extglobChars(PLATFORM_CHARS);

  const {
    DOT_LITERAL,
    PLUS_LITERAL,
    SLASH_LITERAL,
    ONE_CHAR,
    DOTS_SLASH,
    NO_DOT,
    NO_DOT_SLASH,
    NO_DOTS_SLASH,
    QMARK,
    QMARK_NO_DOT,
    STAR,
    START_ANCHOR
  } = PLATFORM_CHARS;

  const globstar = opts => {
    return `(${capture}(?:(?!${START_ANCHOR}${opts.dot ? DOTS_SLASH : DOT_LITERAL}).)*?)`;
  };

  const nodot = opts.dot ? '' : NO_DOT;
  const qmarkNoDot = opts.dot ? QMARK : QMARK_NO_DOT;
  let star = opts.bash === true ? globstar(opts) : STAR;

  if (opts.capture) {
    star = `(${star})`;
  }

  // minimatch options support
  if (typeof opts.noext === 'boolean') {
    opts.noextglob = opts.noext;
  }

  const state = {
    input,
    index: -1,
    start: 0,
    dot: opts.dot === true,
    consumed: '',
    output: '',
    prefix: '',
    backtrack: false,
    negated: false,
    brackets: 0,
    braces: 0,
    parens: 0,
    quotes: 0,
    globstar: false,
    tokens
  };

  input = utils$d.removePrefix(input, state);
  len = input.length;

  const extglobs = [];
  const braces = [];
  const stack = [];
  let prev = bos;
  let value;

  /**
   * Tokenizing helpers
   */

  const eos = () => state.index === len - 1;
  const peek = state.peek = (n = 1) => input[state.index + n];
  const advance = state.advance = () => input[++state.index] || '';
  const remaining = () => input.slice(state.index + 1);
  const consume = (value = '', num = 0) => {
    state.consumed += value;
    state.index += num;
  };

  const append = token => {
    state.output += token.output != null ? token.output : token.value;
    consume(token.value);
  };

  const negate = () => {
    let count = 1;

    while (peek() === '!' && (peek(2) !== '(' || peek(3) === '?')) {
      advance();
      state.start++;
      count++;
    }

    if (count % 2 === 0) {
      return false;
    }

    state.negated = true;
    state.start++;
    return true;
  };

  const increment = type => {
    state[type]++;
    stack.push(type);
  };

  const decrement = type => {
    state[type]--;
    stack.pop();
  };

  /**
   * Push tokens onto the tokens array. This helper speeds up
   * tokenizing by 1) helping us avoid backtracking as much as possible,
   * and 2) helping us avoid creating extra tokens when consecutive
   * characters are plain text. This improves performance and simplifies
   * lookbehinds.
   */

  const push = tok => {
    if (prev.type === 'globstar') {
      const isBrace = state.braces > 0 && (tok.type === 'comma' || tok.type === 'brace');
      const isExtglob = tok.extglob === true || (extglobs.length && (tok.type === 'pipe' || tok.type === 'paren'));

      if (tok.type !== 'slash' && tok.type !== 'paren' && !isBrace && !isExtglob) {
        state.output = state.output.slice(0, -prev.output.length);
        prev.type = 'star';
        prev.value = '*';
        prev.output = star;
        state.output += prev.output;
      }
    }

    if (extglobs.length && tok.type !== 'paren') {
      extglobs[extglobs.length - 1].inner += tok.value;
    }

    if (tok.value || tok.output) append(tok);
    if (prev && prev.type === 'text' && tok.type === 'text') {
      prev.value += tok.value;
      prev.output = (prev.output || '') + tok.value;
      return;
    }

    tok.prev = prev;
    tokens.push(tok);
    prev = tok;
  };

  const extglobOpen = (type, value) => {
    const token = { ...EXTGLOB_CHARS[value], conditions: 1, inner: '' };

    token.prev = prev;
    token.parens = state.parens;
    token.output = state.output;
    const output = (opts.capture ? '(' : '') + token.open;

    increment('parens');
    push({ type, value, output: state.output ? '' : ONE_CHAR });
    push({ type: 'paren', extglob: true, value: advance(), output });
    extglobs.push(token);
  };

  const extglobClose = token => {
    let output = token.close + (opts.capture ? ')' : '');
    let rest;

    if (token.type === 'negate') {
      let extglobStar = star;

      if (token.inner && token.inner.length > 1 && token.inner.includes('/')) {
        extglobStar = globstar(opts);
      }

      if (extglobStar !== star || eos() || /^\)+$/.test(remaining())) {
        output = token.close = `)$))${extglobStar}`;
      }

      if (token.inner.includes('*') && (rest = remaining()) && /^\.[^\\/.]+$/.test(rest)) {
        // Any non-magical string (`.ts`) or even nested expression (`.{ts,tsx}`) can follow after the closing parenthesis.
        // In this case, we need to parse the string and use it in the output of the original pattern.
        // Suitable patterns: `/!(*.d).ts`, `/!(*.d).{ts,tsx}`, `**/!(*-dbg).@(js)`.
        //
        // Disabling the `fastpaths` option due to a problem with parsing strings as `.ts` in the pattern like `**/!(*.d).ts`.
        const expression = parse$1(rest, { ...options, fastpaths: false }).output;

        output = token.close = `)${expression})${extglobStar})`;
      }

      if (token.prev.type === 'bos') {
        state.negatedExtglob = true;
      }
    }

    push({ type: 'paren', extglob: true, value, output });
    decrement('parens');
  };

  /**
   * Fast paths
   */

  if (opts.fastpaths !== false && !/(^[*!]|[/()[\]{}"])/.test(input)) {
    let backslashes = false;

    let output = input.replace(REGEX_SPECIAL_CHARS_BACKREF, (m, esc, chars, first, rest, index) => {
      if (first === '\\') {
        backslashes = true;
        return m;
      }

      if (first === '?') {
        if (esc) {
          return esc + first + (rest ? QMARK.repeat(rest.length) : '');
        }
        if (index === 0) {
          return qmarkNoDot + (rest ? QMARK.repeat(rest.length) : '');
        }
        return QMARK.repeat(chars.length);
      }

      if (first === '.') {
        return DOT_LITERAL.repeat(chars.length);
      }

      if (first === '*') {
        if (esc) {
          return esc + first + (rest ? star : '');
        }
        return star;
      }
      return esc ? m : `\\${m}`;
    });

    if (backslashes === true) {
      if (opts.unescape === true) {
        output = output.replace(/\\/g, '');
      } else {
        output = output.replace(/\\+/g, m => {
          return m.length % 2 === 0 ? '\\\\' : (m ? '\\' : '');
        });
      }
    }

    if (output === input && opts.contains === true) {
      state.output = input;
      return state;
    }

    state.output = utils$d.wrapOutput(output, state, options);
    return state;
  }

  /**
   * Tokenize input until we reach end-of-string
   */

  while (!eos()) {
    value = advance();

    if (value === '\u0000') {
      continue;
    }

    /**
     * Escaped characters
     */

    if (value === '\\') {
      const next = peek();

      if (next === '/' && opts.bash !== true) {
        continue;
      }

      if (next === '.' || next === ';') {
        continue;
      }

      if (!next) {
        value += '\\';
        push({ type: 'text', value });
        continue;
      }

      // collapse slashes to reduce potential for exploits
      const match = /^\\+/.exec(remaining());
      let slashes = 0;

      if (match && match[0].length > 2) {
        slashes = match[0].length;
        state.index += slashes;
        if (slashes % 2 !== 0) {
          value += '\\';
        }
      }

      if (opts.unescape === true) {
        value = advance();
      } else {
        value += advance();
      }

      if (state.brackets === 0) {
        push({ type: 'text', value });
        continue;
      }
    }

    /**
     * If we're inside a regex character class, continue
     * until we reach the closing bracket.
     */

    if (state.brackets > 0 && (value !== ']' || prev.value === '[' || prev.value === '[^')) {
      if (opts.posix !== false && value === ':') {
        const inner = prev.value.slice(1);
        if (inner.includes('[')) {
          prev.posix = true;

          if (inner.includes(':')) {
            const idx = prev.value.lastIndexOf('[');
            const pre = prev.value.slice(0, idx);
            const rest = prev.value.slice(idx + 2);
            const posix = POSIX_REGEX_SOURCE[rest];
            if (posix) {
              prev.value = pre + posix;
              state.backtrack = true;
              advance();

              if (!bos.output && tokens.indexOf(prev) === 1) {
                bos.output = ONE_CHAR;
              }
              continue;
            }
          }
        }
      }

      if ((value === '[' && peek() !== ':') || (value === '-' && peek() === ']')) {
        value = `\\${value}`;
      }

      if (value === ']' && (prev.value === '[' || prev.value === '[^')) {
        value = `\\${value}`;
      }

      if (opts.posix === true && value === '!' && prev.value === '[') {
        value = '^';
      }

      prev.value += value;
      append({ value });
      continue;
    }

    /**
     * If we're inside a quoted string, continue
     * until we reach the closing double quote.
     */

    if (state.quotes === 1 && value !== '"') {
      value = utils$d.escapeRegex(value);
      prev.value += value;
      append({ value });
      continue;
    }

    /**
     * Double quotes
     */

    if (value === '"') {
      state.quotes = state.quotes === 1 ? 0 : 1;
      if (opts.keepQuotes === true) {
        push({ type: 'text', value });
      }
      continue;
    }

    /**
     * Parentheses
     */

    if (value === '(') {
      increment('parens');
      push({ type: 'paren', value });
      continue;
    }

    if (value === ')') {
      if (state.parens === 0 && opts.strictBrackets === true) {
        throw new SyntaxError(syntaxError('opening', '('));
      }

      const extglob = extglobs[extglobs.length - 1];
      if (extglob && state.parens === extglob.parens + 1) {
        extglobClose(extglobs.pop());
        continue;
      }

      push({ type: 'paren', value, output: state.parens ? ')' : '\\)' });
      decrement('parens');
      continue;
    }

    /**
     * Square brackets
     */

    if (value === '[') {
      if (opts.nobracket === true || !remaining().includes(']')) {
        if (opts.nobracket !== true && opts.strictBrackets === true) {
          throw new SyntaxError(syntaxError('closing', ']'));
        }

        value = `\\${value}`;
      } else {
        increment('brackets');
      }

      push({ type: 'bracket', value });
      continue;
    }

    if (value === ']') {
      if (opts.nobracket === true || (prev && prev.type === 'bracket' && prev.value.length === 1)) {
        push({ type: 'text', value, output: `\\${value}` });
        continue;
      }

      if (state.brackets === 0) {
        if (opts.strictBrackets === true) {
          throw new SyntaxError(syntaxError('opening', '['));
        }

        push({ type: 'text', value, output: `\\${value}` });
        continue;
      }

      decrement('brackets');

      const prevValue = prev.value.slice(1);
      if (prev.posix !== true && prevValue[0] === '^' && !prevValue.includes('/')) {
        value = `/${value}`;
      }

      prev.value += value;
      append({ value });

      // when literal brackets are explicitly disabled
      // assume we should match with a regex character class
      if (opts.literalBrackets === false || utils$d.hasRegexChars(prevValue)) {
        continue;
      }

      const escaped = utils$d.escapeRegex(prev.value);
      state.output = state.output.slice(0, -prev.value.length);

      // when literal brackets are explicitly enabled
      // assume we should escape the brackets to match literal characters
      if (opts.literalBrackets === true) {
        state.output += escaped;
        prev.value = escaped;
        continue;
      }

      // when the user specifies nothing, try to match both
      prev.value = `(${capture}${escaped}|${prev.value})`;
      state.output += prev.value;
      continue;
    }

    /**
     * Braces
     */

    if (value === '{' && opts.nobrace !== true) {
      increment('braces');

      const open = {
        type: 'brace',
        value,
        output: '(',
        outputIndex: state.output.length,
        tokensIndex: state.tokens.length
      };

      braces.push(open);
      push(open);
      continue;
    }

    if (value === '}') {
      const brace = braces[braces.length - 1];

      if (opts.nobrace === true || !brace) {
        push({ type: 'text', value, output: value });
        continue;
      }

      let output = ')';

      if (brace.dots === true) {
        const arr = tokens.slice();
        const range = [];

        for (let i = arr.length - 1; i >= 0; i--) {
          tokens.pop();
          if (arr[i].type === 'brace') {
            break;
          }
          if (arr[i].type !== 'dots') {
            range.unshift(arr[i].value);
          }
        }

        output = expandRange(range, opts);
        state.backtrack = true;
      }

      if (brace.comma !== true && brace.dots !== true) {
        const out = state.output.slice(0, brace.outputIndex);
        const toks = state.tokens.slice(brace.tokensIndex);
        brace.value = brace.output = '\\{';
        value = output = '\\}';
        state.output = out;
        for (const t of toks) {
          state.output += (t.output || t.value);
        }
      }

      push({ type: 'brace', value, output });
      decrement('braces');
      braces.pop();
      continue;
    }

    /**
     * Pipes
     */

    if (value === '|') {
      if (extglobs.length > 0) {
        extglobs[extglobs.length - 1].conditions++;
      }
      push({ type: 'text', value });
      continue;
    }

    /**
     * Commas
     */

    if (value === ',') {
      let output = value;

      const brace = braces[braces.length - 1];
      if (brace && stack[stack.length - 1] === 'braces') {
        brace.comma = true;
        output = '|';
      }

      push({ type: 'comma', value, output });
      continue;
    }

    /**
     * Slashes
     */

    if (value === '/') {
      // if the beginning of the glob is "./", advance the start
      // to the current index, and don't add the "./" characters
      // to the state. This greatly simplifies lookbehinds when
      // checking for BOS characters like "!" and "." (not "./")
      if (prev.type === 'dot' && state.index === state.start + 1) {
        state.start = state.index + 1;
        state.consumed = '';
        state.output = '';
        tokens.pop();
        prev = bos; // reset "prev" to the first token
        continue;
      }

      push({ type: 'slash', value, output: SLASH_LITERAL });
      continue;
    }

    /**
     * Dots
     */

    if (value === '.') {
      if (state.braces > 0 && prev.type === 'dot') {
        if (prev.value === '.') prev.output = DOT_LITERAL;
        const brace = braces[braces.length - 1];
        prev.type = 'dots';
        prev.output += value;
        prev.value += value;
        brace.dots = true;
        continue;
      }

      if ((state.braces + state.parens) === 0 && prev.type !== 'bos' && prev.type !== 'slash') {
        push({ type: 'text', value, output: DOT_LITERAL });
        continue;
      }

      push({ type: 'dot', value, output: DOT_LITERAL });
      continue;
    }

    /**
     * Question marks
     */

    if (value === '?') {
      const isGroup = prev && prev.value === '(';
      if (!isGroup && opts.noextglob !== true && peek() === '(' && peek(2) !== '?') {
        extglobOpen('qmark', value);
        continue;
      }

      if (prev && prev.type === 'paren') {
        const next = peek();
        let output = value;

        if (next === '<' && !utils$d.supportsLookbehinds()) {
          throw new Error('Node.js v10 or higher is required for regex lookbehinds');
        }

        if ((prev.value === '(' && !/[!=<:]/.test(next)) || (next === '<' && !/<([!=]|\w+>)/.test(remaining()))) {
          output = `\\${value}`;
        }

        push({ type: 'text', value, output });
        continue;
      }

      if (opts.dot !== true && (prev.type === 'slash' || prev.type === 'bos')) {
        push({ type: 'qmark', value, output: QMARK_NO_DOT });
        continue;
      }

      push({ type: 'qmark', value, output: QMARK });
      continue;
    }

    /**
     * Exclamation
     */

    if (value === '!') {
      if (opts.noextglob !== true && peek() === '(') {
        if (peek(2) !== '?' || !/[!=<:]/.test(peek(3))) {
          extglobOpen('negate', value);
          continue;
        }
      }

      if (opts.nonegate !== true && state.index === 0) {
        negate();
        continue;
      }
    }

    /**
     * Plus
     */

    if (value === '+') {
      if (opts.noextglob !== true && peek() === '(' && peek(2) !== '?') {
        extglobOpen('plus', value);
        continue;
      }

      if ((prev && prev.value === '(') || opts.regex === false) {
        push({ type: 'plus', value, output: PLUS_LITERAL });
        continue;
      }

      if ((prev && (prev.type === 'bracket' || prev.type === 'paren' || prev.type === 'brace')) || state.parens > 0) {
        push({ type: 'plus', value });
        continue;
      }

      push({ type: 'plus', value: PLUS_LITERAL });
      continue;
    }

    /**
     * Plain text
     */

    if (value === '@') {
      if (opts.noextglob !== true && peek() === '(' && peek(2) !== '?') {
        push({ type: 'at', extglob: true, value, output: '' });
        continue;
      }

      push({ type: 'text', value });
      continue;
    }

    /**
     * Plain text
     */

    if (value !== '*') {
      if (value === '$' || value === '^') {
        value = `\\${value}`;
      }

      const match = REGEX_NON_SPECIAL_CHARS.exec(remaining());
      if (match) {
        value += match[0];
        state.index += match[0].length;
      }

      push({ type: 'text', value });
      continue;
    }

    /**
     * Stars
     */

    if (prev && (prev.type === 'globstar' || prev.star === true)) {
      prev.type = 'star';
      prev.star = true;
      prev.value += value;
      prev.output = star;
      state.backtrack = true;
      state.globstar = true;
      consume(value);
      continue;
    }

    let rest = remaining();
    if (opts.noextglob !== true && /^\([^?]/.test(rest)) {
      extglobOpen('star', value);
      continue;
    }

    if (prev.type === 'star') {
      if (opts.noglobstar === true) {
        consume(value);
        continue;
      }

      const prior = prev.prev;
      const before = prior.prev;
      const isStart = prior.type === 'slash' || prior.type === 'bos';
      const afterStar = before && (before.type === 'star' || before.type === 'globstar');

      if (opts.bash === true && (!isStart || (rest[0] && rest[0] !== '/'))) {
        push({ type: 'star', value, output: '' });
        continue;
      }

      const isBrace = state.braces > 0 && (prior.type === 'comma' || prior.type === 'brace');
      const isExtglob = extglobs.length && (prior.type === 'pipe' || prior.type === 'paren');
      if (!isStart && prior.type !== 'paren' && !isBrace && !isExtglob) {
        push({ type: 'star', value, output: '' });
        continue;
      }

      // strip consecutive `/**/`
      while (rest.slice(0, 3) === '/**') {
        const after = input[state.index + 4];
        if (after && after !== '/') {
          break;
        }
        rest = rest.slice(3);
        consume('/**', 3);
      }

      if (prior.type === 'bos' && eos()) {
        prev.type = 'globstar';
        prev.value += value;
        prev.output = globstar(opts);
        state.output = prev.output;
        state.globstar = true;
        consume(value);
        continue;
      }

      if (prior.type === 'slash' && prior.prev.type !== 'bos' && !afterStar && eos()) {
        state.output = state.output.slice(0, -(prior.output + prev.output).length);
        prior.output = `(?:${prior.output}`;

        prev.type = 'globstar';
        prev.output = globstar(opts) + (opts.strictSlashes ? ')' : '|$)');
        prev.value += value;
        state.globstar = true;
        state.output += prior.output + prev.output;
        consume(value);
        continue;
      }

      if (prior.type === 'slash' && prior.prev.type !== 'bos' && rest[0] === '/') {
        const end = rest[1] !== void 0 ? '|$' : '';

        state.output = state.output.slice(0, -(prior.output + prev.output).length);
        prior.output = `(?:${prior.output}`;

        prev.type = 'globstar';
        prev.output = `${globstar(opts)}${SLASH_LITERAL}|${SLASH_LITERAL}${end})`;
        prev.value += value;

        state.output += prior.output + prev.output;
        state.globstar = true;

        consume(value + advance());

        push({ type: 'slash', value: '/', output: '' });
        continue;
      }

      if (prior.type === 'bos' && rest[0] === '/') {
        prev.type = 'globstar';
        prev.value += value;
        prev.output = `(?:^|${SLASH_LITERAL}|${globstar(opts)}${SLASH_LITERAL})`;
        state.output = prev.output;
        state.globstar = true;
        consume(value + advance());
        push({ type: 'slash', value: '/', output: '' });
        continue;
      }

      // remove single star from output
      state.output = state.output.slice(0, -prev.output.length);

      // reset previous token to globstar
      prev.type = 'globstar';
      prev.output = globstar(opts);
      prev.value += value;

      // reset output with globstar
      state.output += prev.output;
      state.globstar = true;
      consume(value);
      continue;
    }

    const token = { type: 'star', value, output: star };

    if (opts.bash === true) {
      token.output = '.*?';
      if (prev.type === 'bos' || prev.type === 'slash') {
        token.output = nodot + token.output;
      }
      push(token);
      continue;
    }

    if (prev && (prev.type === 'bracket' || prev.type === 'paren') && opts.regex === true) {
      token.output = value;
      push(token);
      continue;
    }

    if (state.index === state.start || prev.type === 'slash' || prev.type === 'dot') {
      if (prev.type === 'dot') {
        state.output += NO_DOT_SLASH;
        prev.output += NO_DOT_SLASH;

      } else if (opts.dot === true) {
        state.output += NO_DOTS_SLASH;
        prev.output += NO_DOTS_SLASH;

      } else {
        state.output += nodot;
        prev.output += nodot;
      }

      if (peek() !== '*') {
        state.output += ONE_CHAR;
        prev.output += ONE_CHAR;
      }
    }

    push(token);
  }

  while (state.brackets > 0) {
    if (opts.strictBrackets === true) throw new SyntaxError(syntaxError('closing', ']'));
    state.output = utils$d.escapeLast(state.output, '[');
    decrement('brackets');
  }

  while (state.parens > 0) {
    if (opts.strictBrackets === true) throw new SyntaxError(syntaxError('closing', ')'));
    state.output = utils$d.escapeLast(state.output, '(');
    decrement('parens');
  }

  while (state.braces > 0) {
    if (opts.strictBrackets === true) throw new SyntaxError(syntaxError('closing', '}'));
    state.output = utils$d.escapeLast(state.output, '{');
    decrement('braces');
  }

  if (opts.strictSlashes !== true && (prev.type === 'star' || prev.type === 'bracket')) {
    push({ type: 'maybe_slash', value: '', output: `${SLASH_LITERAL}?` });
  }

  // rebuild the output if we had to backtrack at any point
  if (state.backtrack === true) {
    state.output = '';

    for (const token of state.tokens) {
      state.output += token.output != null ? token.output : token.value;

      if (token.suffix) {
        state.output += token.suffix;
      }
    }
  }

  return state;
};

/**
 * Fast paths for creating regular expressions for common glob patterns.
 * This can significantly speed up processing and has very little downside
 * impact when none of the fast paths match.
 */

parse$1.fastpaths = (input, options) => {
  const opts = { ...options };
  const max = typeof opts.maxLength === 'number' ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
  const len = input.length;
  if (len > max) {
    throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
  }

  input = REPLACEMENTS[input] || input;
  const win32 = utils$d.isWindows(options);

  // create constants based on platform, for windows or posix
  const {
    DOT_LITERAL,
    SLASH_LITERAL,
    ONE_CHAR,
    DOTS_SLASH,
    NO_DOT,
    NO_DOTS,
    NO_DOTS_SLASH,
    STAR,
    START_ANCHOR
  } = constants$2.globChars(win32);

  const nodot = opts.dot ? NO_DOTS : NO_DOT;
  const slashDot = opts.dot ? NO_DOTS_SLASH : NO_DOT;
  const capture = opts.capture ? '' : '?:';
  const state = { negated: false, prefix: '' };
  let star = opts.bash === true ? '.*?' : STAR;

  if (opts.capture) {
    star = `(${star})`;
  }

  const globstar = opts => {
    if (opts.noglobstar === true) return star;
    return `(${capture}(?:(?!${START_ANCHOR}${opts.dot ? DOTS_SLASH : DOT_LITERAL}).)*?)`;
  };

  const create = str => {
    switch (str) {
      case '*':
        return `${nodot}${ONE_CHAR}${star}`;

      case '.*':
        return `${DOT_LITERAL}${ONE_CHAR}${star}`;

      case '*.*':
        return `${nodot}${star}${DOT_LITERAL}${ONE_CHAR}${star}`;

      case '*/*':
        return `${nodot}${star}${SLASH_LITERAL}${ONE_CHAR}${slashDot}${star}`;

      case '**':
        return nodot + globstar(opts);

      case '**/*':
        return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${slashDot}${ONE_CHAR}${star}`;

      case '**/*.*':
        return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${slashDot}${star}${DOT_LITERAL}${ONE_CHAR}${star}`;

      case '**/.*':
        return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${DOT_LITERAL}${ONE_CHAR}${star}`;

      default: {
        const match = /^(.*?)\.(\w+)$/.exec(str);
        if (!match) return;

        const source = create(match[1]);
        if (!source) return;

        return source + DOT_LITERAL + match[2];
      }
    }
  };

  const output = utils$d.removePrefix(input, state);
  let source = create(output);

  if (source && opts.strictSlashes !== true) {
    source += `${SLASH_LITERAL}?`;
  }

  return source;
};

var parse_1 = parse$1;

const path$7 = require$$0$4;
const scan = scan_1;
const parse = parse_1;
const utils$c = utils$f;
const constants$1 = constants$3;
const isObject = val => val && typeof val === 'object' && !Array.isArray(val);

/**
 * Creates a matcher function from one or more glob patterns. The
 * returned function takes a string to match as its first argument,
 * and returns true if the string is a match. The returned matcher
 * function also takes a boolean as the second argument that, when true,
 * returns an object with additional information.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch(glob[, options]);
 *
 * const isMatch = picomatch('*.!(*a)');
 * console.log(isMatch('a.a')); //=> false
 * console.log(isMatch('a.b')); //=> true
 * ```
 * @name picomatch
 * @param {String|Array} `globs` One or more glob patterns.
 * @param {Object=} `options`
 * @return {Function=} Returns a matcher function.
 * @api public
 */

const picomatch$2 = (glob, options, returnState = false) => {
  if (Array.isArray(glob)) {
    const fns = glob.map(input => picomatch$2(input, options, returnState));
    const arrayMatcher = str => {
      for (const isMatch of fns) {
        const state = isMatch(str);
        if (state) return state;
      }
      return false;
    };
    return arrayMatcher;
  }

  const isState = isObject(glob) && glob.tokens && glob.input;

  if (glob === '' || (typeof glob !== 'string' && !isState)) {
    throw new TypeError('Expected pattern to be a non-empty string');
  }

  const opts = options || {};
  const posix = utils$c.isWindows(options);
  const regex = isState
    ? picomatch$2.compileRe(glob, options)
    : picomatch$2.makeRe(glob, options, false, true);

  const state = regex.state;
  delete regex.state;

  let isIgnored = () => false;
  if (opts.ignore) {
    const ignoreOpts = { ...options, ignore: null, onMatch: null, onResult: null };
    isIgnored = picomatch$2(opts.ignore, ignoreOpts, returnState);
  }

  const matcher = (input, returnObject = false) => {
    const { isMatch, match, output } = picomatch$2.test(input, regex, options, { glob, posix });
    const result = { glob, state, regex, posix, input, output, match, isMatch };

    if (typeof opts.onResult === 'function') {
      opts.onResult(result);
    }

    if (isMatch === false) {
      result.isMatch = false;
      return returnObject ? result : false;
    }

    if (isIgnored(input)) {
      if (typeof opts.onIgnore === 'function') {
        opts.onIgnore(result);
      }
      result.isMatch = false;
      return returnObject ? result : false;
    }

    if (typeof opts.onMatch === 'function') {
      opts.onMatch(result);
    }
    return returnObject ? result : true;
  };

  if (returnState) {
    matcher.state = state;
  }

  return matcher;
};

/**
 * Test `input` with the given `regex`. This is used by the main
 * `picomatch()` function to test the input string.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch.test(input, regex[, options]);
 *
 * console.log(picomatch.test('foo/bar', /^(?:([^/]*?)\/([^/]*?))$/));
 * // { isMatch: true, match: [ 'foo/', 'foo', 'bar' ], output: 'foo/bar' }
 * ```
 * @param {String} `input` String to test.
 * @param {RegExp} `regex`
 * @return {Object} Returns an object with matching info.
 * @api public
 */

picomatch$2.test = (input, regex, options, { glob, posix } = {}) => {
  if (typeof input !== 'string') {
    throw new TypeError('Expected input to be a string');
  }

  if (input === '') {
    return { isMatch: false, output: '' };
  }

  const opts = options || {};
  const format = opts.format || (posix ? utils$c.toPosixSlashes : null);
  let match = input === glob;
  let output = (match && format) ? format(input) : input;

  if (match === false) {
    output = format ? format(input) : input;
    match = output === glob;
  }

  if (match === false || opts.capture === true) {
    if (opts.matchBase === true || opts.basename === true) {
      match = picomatch$2.matchBase(input, regex, options, posix);
    } else {
      match = regex.exec(output);
    }
  }

  return { isMatch: Boolean(match), match, output };
};

/**
 * Match the basename of a filepath.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch.matchBase(input, glob[, options]);
 * console.log(picomatch.matchBase('foo/bar.js', '*.js'); // true
 * ```
 * @param {String} `input` String to test.
 * @param {RegExp|String} `glob` Glob pattern or regex created by [.makeRe](#makeRe).
 * @return {Boolean}
 * @api public
 */

picomatch$2.matchBase = (input, glob, options, posix = utils$c.isWindows(options)) => {
  const regex = glob instanceof RegExp ? glob : picomatch$2.makeRe(glob, options);
  return regex.test(path$7.basename(input));
};

/**
 * Returns true if **any** of the given glob `patterns` match the specified `string`.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch.isMatch(string, patterns[, options]);
 *
 * console.log(picomatch.isMatch('a.a', ['b.*', '*.a'])); //=> true
 * console.log(picomatch.isMatch('a.a', 'b.*')); //=> false
 * ```
 * @param {String|Array} str The string to test.
 * @param {String|Array} patterns One or more glob patterns to use for matching.
 * @param {Object} [options] See available [options](#options).
 * @return {Boolean} Returns true if any patterns match `str`
 * @api public
 */

picomatch$2.isMatch = (str, patterns, options) => picomatch$2(patterns, options)(str);

/**
 * Parse a glob pattern to create the source string for a regular
 * expression.
 *
 * ```js
 * const picomatch = require('picomatch');
 * const result = picomatch.parse(pattern[, options]);
 * ```
 * @param {String} `pattern`
 * @param {Object} `options`
 * @return {Object} Returns an object with useful properties and output to be used as a regex source string.
 * @api public
 */

picomatch$2.parse = (pattern, options) => {
  if (Array.isArray(pattern)) return pattern.map(p => picomatch$2.parse(p, options));
  return parse(pattern, { ...options, fastpaths: false });
};

/**
 * Scan a glob pattern to separate the pattern into segments.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch.scan(input[, options]);
 *
 * const result = picomatch.scan('!./foo/*.js');
 * console.log(result);
 * { prefix: '!./',
 *   input: '!./foo/*.js',
 *   start: 3,
 *   base: 'foo',
 *   glob: '*.js',
 *   isBrace: false,
 *   isBracket: false,
 *   isGlob: true,
 *   isExtglob: false,
 *   isGlobstar: false,
 *   negated: true }
 * ```
 * @param {String} `input` Glob pattern to scan.
 * @param {Object} `options`
 * @return {Object} Returns an object with
 * @api public
 */

picomatch$2.scan = (input, options) => scan(input, options);

/**
 * Compile a regular expression from the `state` object returned by the
 * [parse()](#parse) method.
 *
 * @param {Object} `state`
 * @param {Object} `options`
 * @param {Boolean} `returnOutput` Intended for implementors, this argument allows you to return the raw output from the parser.
 * @param {Boolean} `returnState` Adds the state to a `state` property on the returned regex. Useful for implementors and debugging.
 * @return {RegExp}
 * @api public
 */

picomatch$2.compileRe = (state, options, returnOutput = false, returnState = false) => {
  if (returnOutput === true) {
    return state.output;
  }

  const opts = options || {};
  const prepend = opts.contains ? '' : '^';
  const append = opts.contains ? '' : '$';

  let source = `${prepend}(?:${state.output})${append}`;
  if (state && state.negated === true) {
    source = `^(?!${source}).*$`;
  }

  const regex = picomatch$2.toRegex(source, options);
  if (returnState === true) {
    regex.state = state;
  }

  return regex;
};

/**
 * Create a regular expression from a parsed glob pattern.
 *
 * ```js
 * const picomatch = require('picomatch');
 * const state = picomatch.parse('*.js');
 * // picomatch.compileRe(state[, options]);
 *
 * console.log(picomatch.compileRe(state));
 * //=> /^(?:(?!\.)(?=.)[^/]*?\.js)$/
 * ```
 * @param {String} `state` The object returned from the `.parse` method.
 * @param {Object} `options`
 * @param {Boolean} `returnOutput` Implementors may use this argument to return the compiled output, instead of a regular expression. This is not exposed on the options to prevent end-users from mutating the result.
 * @param {Boolean} `returnState` Implementors may use this argument to return the state from the parsed glob with the returned regular expression.
 * @return {RegExp} Returns a regex created from the given pattern.
 * @api public
 */

picomatch$2.makeRe = (input, options = {}, returnOutput = false, returnState = false) => {
  if (!input || typeof input !== 'string') {
    throw new TypeError('Expected a non-empty string');
  }

  let parsed = { negated: false, fastpaths: true };

  if (options.fastpaths !== false && (input[0] === '.' || input[0] === '*')) {
    parsed.output = parse.fastpaths(input, options);
  }

  if (!parsed.output) {
    parsed = parse(input, options);
  }

  return picomatch$2.compileRe(parsed, options, returnOutput, returnState);
};

/**
 * Create a regular expression from the given regex source string.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch.toRegex(source[, options]);
 *
 * const { output } = picomatch.parse('*.js');
 * console.log(picomatch.toRegex(output));
 * //=> /^(?:(?!\.)(?=.)[^/]*?\.js)$/
 * ```
 * @param {String} `source` Regular expression source string.
 * @param {Object} `options`
 * @return {RegExp}
 * @api public
 */

picomatch$2.toRegex = (source, options) => {
  try {
    const opts = options || {};
    return new RegExp(source, opts.flags || (opts.nocase ? 'i' : ''));
  } catch (err) {
    if (options && options.debug === true) throw err;
    return /$^/;
  }
};

/**
 * Picomatch constants.
 * @return {Object}
 */

picomatch$2.constants = constants$1;

/**
 * Expose "picomatch"
 */

var picomatch_1 = picomatch$2;

var picomatch$1 = picomatch_1;

const util = require$$0$3;
const braces = braces_1;
const picomatch = picomatch$1;
const utils$b = utils$f;
const isEmptyString = val => val === '' || val === './';

/**
 * Returns an array of strings that match one or more glob patterns.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm(list, patterns[, options]);
 *
 * console.log(mm(['a.js', 'a.txt'], ['*.js']));
 * //=> [ 'a.js' ]
 * ```
 * @param {String|Array<string>} `list` List of strings to match.
 * @param {String|Array<string>} `patterns` One or more glob patterns to use for matching.
 * @param {Object} `options` See available [options](#options)
 * @return {Array} Returns an array of matches
 * @summary false
 * @api public
 */

const micromatch$1 = (list, patterns, options) => {
  patterns = [].concat(patterns);
  list = [].concat(list);

  let omit = new Set();
  let keep = new Set();
  let items = new Set();
  let negatives = 0;

  let onResult = state => {
    items.add(state.output);
    if (options && options.onResult) {
      options.onResult(state);
    }
  };

  for (let i = 0; i < patterns.length; i++) {
    let isMatch = picomatch(String(patterns[i]), { ...options, onResult }, true);
    let negated = isMatch.state.negated || isMatch.state.negatedExtglob;
    if (negated) negatives++;

    for (let item of list) {
      let matched = isMatch(item, true);

      let match = negated ? !matched.isMatch : matched.isMatch;
      if (!match) continue;

      if (negated) {
        omit.add(matched.output);
      } else {
        omit.delete(matched.output);
        keep.add(matched.output);
      }
    }
  }

  let result = negatives === patterns.length ? [...items] : [...keep];
  let matches = result.filter(item => !omit.has(item));

  if (options && matches.length === 0) {
    if (options.failglob === true) {
      throw new Error(`No matches found for "${patterns.join(', ')}"`);
    }

    if (options.nonull === true || options.nullglob === true) {
      return options.unescape ? patterns.map(p => p.replace(/\\/g, '')) : patterns;
    }
  }

  return matches;
};

/**
 * Backwards compatibility
 */

micromatch$1.match = micromatch$1;

/**
 * Returns a matcher function from the given glob `pattern` and `options`.
 * The returned function takes a string to match as its only argument and returns
 * true if the string is a match.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.matcher(pattern[, options]);
 *
 * const isMatch = mm.matcher('*.!(*a)');
 * console.log(isMatch('a.a')); //=> false
 * console.log(isMatch('a.b')); //=> true
 * ```
 * @param {String} `pattern` Glob pattern
 * @param {Object} `options`
 * @return {Function} Returns a matcher function.
 * @api public
 */

micromatch$1.matcher = (pattern, options) => picomatch(pattern, options);

/**
 * Returns true if **any** of the given glob `patterns` match the specified `string`.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.isMatch(string, patterns[, options]);
 *
 * console.log(mm.isMatch('a.a', ['b.*', '*.a'])); //=> true
 * console.log(mm.isMatch('a.a', 'b.*')); //=> false
 * ```
 * @param {String} `str` The string to test.
 * @param {String|Array} `patterns` One or more glob patterns to use for matching.
 * @param {Object} `[options]` See available [options](#options).
 * @return {Boolean} Returns true if any patterns match `str`
 * @api public
 */

micromatch$1.isMatch = (str, patterns, options) => picomatch(patterns, options)(str);

/**
 * Backwards compatibility
 */

micromatch$1.any = micromatch$1.isMatch;

/**
 * Returns a list of strings that _**do not match any**_ of the given `patterns`.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.not(list, patterns[, options]);
 *
 * console.log(mm.not(['a.a', 'b.b', 'c.c'], '*.a'));
 * //=> ['b.b', 'c.c']
 * ```
 * @param {Array} `list` Array of strings to match.
 * @param {String|Array} `patterns` One or more glob pattern to use for matching.
 * @param {Object} `options` See available [options](#options) for changing how matches are performed
 * @return {Array} Returns an array of strings that **do not match** the given patterns.
 * @api public
 */

micromatch$1.not = (list, patterns, options = {}) => {
  patterns = [].concat(patterns).map(String);
  let result = new Set();
  let items = [];

  let onResult = state => {
    if (options.onResult) options.onResult(state);
    items.push(state.output);
  };

  let matches = micromatch$1(list, patterns, { ...options, onResult });

  for (let item of items) {
    if (!matches.includes(item)) {
      result.add(item);
    }
  }
  return [...result];
};

/**
 * Returns true if the given `string` contains the given pattern. Similar
 * to [.isMatch](#isMatch) but the pattern can match any part of the string.
 *
 * ```js
 * var mm = require('micromatch');
 * // mm.contains(string, pattern[, options]);
 *
 * console.log(mm.contains('aa/bb/cc', '*b'));
 * //=> true
 * console.log(mm.contains('aa/bb/cc', '*d'));
 * //=> false
 * ```
 * @param {String} `str` The string to match.
 * @param {String|Array} `patterns` Glob pattern to use for matching.
 * @param {Object} `options` See available [options](#options) for changing how matches are performed
 * @return {Boolean} Returns true if any of the patterns matches any part of `str`.
 * @api public
 */

micromatch$1.contains = (str, pattern, options) => {
  if (typeof str !== 'string') {
    throw new TypeError(`Expected a string: "${util.inspect(str)}"`);
  }

  if (Array.isArray(pattern)) {
    return pattern.some(p => micromatch$1.contains(str, p, options));
  }

  if (typeof pattern === 'string') {
    if (isEmptyString(str) || isEmptyString(pattern)) {
      return false;
    }

    if (str.includes(pattern) || (str.startsWith('./') && str.slice(2).includes(pattern))) {
      return true;
    }
  }

  return micromatch$1.isMatch(str, pattern, { ...options, contains: true });
};

/**
 * Filter the keys of the given object with the given `glob` pattern
 * and `options`. Does not attempt to match nested keys. If you need this feature,
 * use [glob-object][] instead.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.matchKeys(object, patterns[, options]);
 *
 * const obj = { aa: 'a', ab: 'b', ac: 'c' };
 * console.log(mm.matchKeys(obj, '*b'));
 * //=> { ab: 'b' }
 * ```
 * @param {Object} `object` The object with keys to filter.
 * @param {String|Array} `patterns` One or more glob patterns to use for matching.
 * @param {Object} `options` See available [options](#options) for changing how matches are performed
 * @return {Object} Returns an object with only keys that match the given patterns.
 * @api public
 */

micromatch$1.matchKeys = (obj, patterns, options) => {
  if (!utils$b.isObject(obj)) {
    throw new TypeError('Expected the first argument to be an object');
  }
  let keys = micromatch$1(Object.keys(obj), patterns, options);
  let res = {};
  for (let key of keys) res[key] = obj[key];
  return res;
};

/**
 * Returns true if some of the strings in the given `list` match any of the given glob `patterns`.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.some(list, patterns[, options]);
 *
 * console.log(mm.some(['foo.js', 'bar.js'], ['*.js', '!foo.js']));
 * // true
 * console.log(mm.some(['foo.js'], ['*.js', '!foo.js']));
 * // false
 * ```
 * @param {String|Array} `list` The string or array of strings to test. Returns as soon as the first match is found.
 * @param {String|Array} `patterns` One or more glob patterns to use for matching.
 * @param {Object} `options` See available [options](#options) for changing how matches are performed
 * @return {Boolean} Returns true if any `patterns` matches any of the strings in `list`
 * @api public
 */

micromatch$1.some = (list, patterns, options) => {
  let items = [].concat(list);

  for (let pattern of [].concat(patterns)) {
    let isMatch = picomatch(String(pattern), options);
    if (items.some(item => isMatch(item))) {
      return true;
    }
  }
  return false;
};

/**
 * Returns true if every string in the given `list` matches
 * any of the given glob `patterns`.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.every(list, patterns[, options]);
 *
 * console.log(mm.every('foo.js', ['foo.js']));
 * // true
 * console.log(mm.every(['foo.js', 'bar.js'], ['*.js']));
 * // true
 * console.log(mm.every(['foo.js', 'bar.js'], ['*.js', '!foo.js']));
 * // false
 * console.log(mm.every(['foo.js'], ['*.js', '!foo.js']));
 * // false
 * ```
 * @param {String|Array} `list` The string or array of strings to test.
 * @param {String|Array} `patterns` One or more glob patterns to use for matching.
 * @param {Object} `options` See available [options](#options) for changing how matches are performed
 * @return {Boolean} Returns true if all `patterns` matches all of the strings in `list`
 * @api public
 */

micromatch$1.every = (list, patterns, options) => {
  let items = [].concat(list);

  for (let pattern of [].concat(patterns)) {
    let isMatch = picomatch(String(pattern), options);
    if (!items.every(item => isMatch(item))) {
      return false;
    }
  }
  return true;
};

/**
 * Returns true if **all** of the given `patterns` match
 * the specified string.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.all(string, patterns[, options]);
 *
 * console.log(mm.all('foo.js', ['foo.js']));
 * // true
 *
 * console.log(mm.all('foo.js', ['*.js', '!foo.js']));
 * // false
 *
 * console.log(mm.all('foo.js', ['*.js', 'foo.js']));
 * // true
 *
 * console.log(mm.all('foo.js', ['*.js', 'f*', '*o*', '*o.js']));
 * // true
 * ```
 * @param {String|Array} `str` The string to test.
 * @param {String|Array} `patterns` One or more glob patterns to use for matching.
 * @param {Object} `options` See available [options](#options) for changing how matches are performed
 * @return {Boolean} Returns true if any patterns match `str`
 * @api public
 */

micromatch$1.all = (str, patterns, options) => {
  if (typeof str !== 'string') {
    throw new TypeError(`Expected a string: "${util.inspect(str)}"`);
  }

  return [].concat(patterns).every(p => picomatch(p, options)(str));
};

/**
 * Returns an array of matches captured by `pattern` in `string, or `null` if the pattern did not match.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.capture(pattern, string[, options]);
 *
 * console.log(mm.capture('test/*.js', 'test/foo.js'));
 * //=> ['foo']
 * console.log(mm.capture('test/*.js', 'foo/bar.css'));
 * //=> null
 * ```
 * @param {String} `glob` Glob pattern to use for matching.
 * @param {String} `input` String to match
 * @param {Object} `options` See available [options](#options) for changing how matches are performed
 * @return {Array|null} Returns an array of captures if the input matches the glob pattern, otherwise `null`.
 * @api public
 */

micromatch$1.capture = (glob, input, options) => {
  let posix = utils$b.isWindows(options);
  let regex = picomatch.makeRe(String(glob), { ...options, capture: true });
  let match = regex.exec(posix ? utils$b.toPosixSlashes(input) : input);

  if (match) {
    return match.slice(1).map(v => v === void 0 ? '' : v);
  }
};

/**
 * Create a regular expression from the given glob `pattern`.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.makeRe(pattern[, options]);
 *
 * console.log(mm.makeRe('*.js'));
 * //=> /^(?:(\.[\\\/])?(?!\.)(?=.)[^\/]*?\.js)$/
 * ```
 * @param {String} `pattern` A glob pattern to convert to regex.
 * @param {Object} `options`
 * @return {RegExp} Returns a regex created from the given pattern.
 * @api public
 */

micromatch$1.makeRe = (...args) => picomatch.makeRe(...args);

/**
 * Scan a glob pattern to separate the pattern into segments. Used
 * by the [split](#split) method.
 *
 * ```js
 * const mm = require('micromatch');
 * const state = mm.scan(pattern[, options]);
 * ```
 * @param {String} `pattern`
 * @param {Object} `options`
 * @return {Object} Returns an object with
 * @api public
 */

micromatch$1.scan = (...args) => picomatch.scan(...args);

/**
 * Parse a glob pattern to create the source string for a regular
 * expression.
 *
 * ```js
 * const mm = require('micromatch');
 * const state = mm(pattern[, options]);
 * ```
 * @param {String} `glob`
 * @param {Object} `options`
 * @return {Object} Returns an object with useful properties and output to be used as regex source string.
 * @api public
 */

micromatch$1.parse = (patterns, options) => {
  let res = [];
  for (let pattern of [].concat(patterns || [])) {
    for (let str of braces(String(pattern), options)) {
      res.push(picomatch.parse(str, options));
    }
  }
  return res;
};

/**
 * Process the given brace `pattern`.
 *
 * ```js
 * const { braces } = require('micromatch');
 * console.log(braces('foo/{a,b,c}/bar'));
 * //=> [ 'foo/(a|b|c)/bar' ]
 *
 * console.log(braces('foo/{a,b,c}/bar', { expand: true }));
 * //=> [ 'foo/a/bar', 'foo/b/bar', 'foo/c/bar' ]
 * ```
 * @param {String} `pattern` String with brace pattern to process.
 * @param {Object} `options` Any [options](#options) to change how expansion is performed. See the [braces][] library for all available options.
 * @return {Array}
 * @api public
 */

micromatch$1.braces = (pattern, options) => {
  if (typeof pattern !== 'string') throw new TypeError('Expected a string');
  if ((options && options.nobrace === true) || !/\{.*\}/.test(pattern)) {
    return [pattern];
  }
  return braces(pattern, options);
};

/**
 * Expand braces
 */

micromatch$1.braceExpand = (pattern, options) => {
  if (typeof pattern !== 'string') throw new TypeError('Expected a string');
  return micromatch$1.braces(pattern, { ...options, expand: true });
};

/**
 * Expose micromatch
 */

var micromatch_1 = micromatch$1;

Object.defineProperty(pattern$1, "__esModule", { value: true });
pattern$1.matchAny = pattern$1.convertPatternsToRe = pattern$1.makeRe = pattern$1.getPatternParts = pattern$1.expandBraceExpansion = pattern$1.expandPatternsWithBraceExpansion = pattern$1.isAffectDepthOfReadingPattern = pattern$1.endsWithSlashGlobStar = pattern$1.hasGlobStar = pattern$1.getBaseDirectory = pattern$1.isPatternRelatedToParentDirectory = pattern$1.getPatternsOutsideCurrentDirectory = pattern$1.getPatternsInsideCurrentDirectory = pattern$1.getPositivePatterns = pattern$1.getNegativePatterns = pattern$1.isPositivePattern = pattern$1.isNegativePattern = pattern$1.convertToNegativePattern = pattern$1.convertToPositivePattern = pattern$1.isDynamicPattern = pattern$1.isStaticPattern = void 0;
const path$6 = require$$0$4;
const globParent = globParent$1;
const micromatch = micromatch_1;
const GLOBSTAR = '**';
const ESCAPE_SYMBOL = '\\';
const COMMON_GLOB_SYMBOLS_RE = /[*?]|^!/;
const REGEX_CHARACTER_CLASS_SYMBOLS_RE = /\[[^[]*]/;
const REGEX_GROUP_SYMBOLS_RE = /(?:^|[^!*+?@])\([^(]*\|[^|]*\)/;
const GLOB_EXTENSION_SYMBOLS_RE = /[!*+?@]\([^(]*\)/;
const BRACE_EXPANSION_SEPARATORS_RE = /,|\.\./;
function isStaticPattern(pattern, options = {}) {
    return !isDynamicPattern(pattern, options);
}
pattern$1.isStaticPattern = isStaticPattern;
function isDynamicPattern(pattern, options = {}) {
    /**
     * A special case with an empty string is necessary for matching patterns that start with a forward slash.
     * An empty string cannot be a dynamic pattern.
     * For example, the pattern `/lib/*` will be spread into parts: '', 'lib', '*'.
     */
    if (pattern === '') {
        return false;
    }
    /**
     * When the `caseSensitiveMatch` option is disabled, all patterns must be marked as dynamic, because we cannot check
     * filepath directly (without read directory).
     */
    if (options.caseSensitiveMatch === false || pattern.includes(ESCAPE_SYMBOL)) {
        return true;
    }
    if (COMMON_GLOB_SYMBOLS_RE.test(pattern) || REGEX_CHARACTER_CLASS_SYMBOLS_RE.test(pattern) || REGEX_GROUP_SYMBOLS_RE.test(pattern)) {
        return true;
    }
    if (options.extglob !== false && GLOB_EXTENSION_SYMBOLS_RE.test(pattern)) {
        return true;
    }
    if (options.braceExpansion !== false && hasBraceExpansion(pattern)) {
        return true;
    }
    return false;
}
pattern$1.isDynamicPattern = isDynamicPattern;
function hasBraceExpansion(pattern) {
    const openingBraceIndex = pattern.indexOf('{');
    if (openingBraceIndex === -1) {
        return false;
    }
    const closingBraceIndex = pattern.indexOf('}', openingBraceIndex + 1);
    if (closingBraceIndex === -1) {
        return false;
    }
    const braceContent = pattern.slice(openingBraceIndex, closingBraceIndex);
    return BRACE_EXPANSION_SEPARATORS_RE.test(braceContent);
}
function convertToPositivePattern(pattern) {
    return isNegativePattern$1(pattern) ? pattern.slice(1) : pattern;
}
pattern$1.convertToPositivePattern = convertToPositivePattern;
function convertToNegativePattern(pattern) {
    return '!' + pattern;
}
pattern$1.convertToNegativePattern = convertToNegativePattern;
function isNegativePattern$1(pattern) {
    return pattern.startsWith('!') && pattern[1] !== '(';
}
pattern$1.isNegativePattern = isNegativePattern$1;
function isPositivePattern(pattern) {
    return !isNegativePattern$1(pattern);
}
pattern$1.isPositivePattern = isPositivePattern;
function getNegativePatterns(patterns) {
    return patterns.filter(isNegativePattern$1);
}
pattern$1.getNegativePatterns = getNegativePatterns;
function getPositivePatterns$1(patterns) {
    return patterns.filter(isPositivePattern);
}
pattern$1.getPositivePatterns = getPositivePatterns$1;
/**
 * Returns patterns that can be applied inside the current directory.
 *
 * @example
 * // ['./*', '*', 'a/*']
 * getPatternsInsideCurrentDirectory(['./*', '*', 'a/*', '../*', './../*'])
 */
function getPatternsInsideCurrentDirectory(patterns) {
    return patterns.filter((pattern) => !isPatternRelatedToParentDirectory(pattern));
}
pattern$1.getPatternsInsideCurrentDirectory = getPatternsInsideCurrentDirectory;
/**
 * Returns patterns to be expanded relative to (outside) the current directory.
 *
 * @example
 * // ['../*', './../*']
 * getPatternsInsideCurrentDirectory(['./*', '*', 'a/*', '../*', './../*'])
 */
function getPatternsOutsideCurrentDirectory(patterns) {
    return patterns.filter(isPatternRelatedToParentDirectory);
}
pattern$1.getPatternsOutsideCurrentDirectory = getPatternsOutsideCurrentDirectory;
function isPatternRelatedToParentDirectory(pattern) {
    return pattern.startsWith('..') || pattern.startsWith('./..');
}
pattern$1.isPatternRelatedToParentDirectory = isPatternRelatedToParentDirectory;
function getBaseDirectory(pattern) {
    return globParent(pattern, { flipBackslashes: false });
}
pattern$1.getBaseDirectory = getBaseDirectory;
function hasGlobStar(pattern) {
    return pattern.includes(GLOBSTAR);
}
pattern$1.hasGlobStar = hasGlobStar;
function endsWithSlashGlobStar(pattern) {
    return pattern.endsWith('/' + GLOBSTAR);
}
pattern$1.endsWithSlashGlobStar = endsWithSlashGlobStar;
function isAffectDepthOfReadingPattern(pattern) {
    const basename = path$6.basename(pattern);
    return endsWithSlashGlobStar(pattern) || isStaticPattern(basename);
}
pattern$1.isAffectDepthOfReadingPattern = isAffectDepthOfReadingPattern;
function expandPatternsWithBraceExpansion(patterns) {
    return patterns.reduce((collection, pattern) => {
        return collection.concat(expandBraceExpansion(pattern));
    }, []);
}
pattern$1.expandPatternsWithBraceExpansion = expandPatternsWithBraceExpansion;
function expandBraceExpansion(pattern) {
    return micromatch.braces(pattern, {
        expand: true,
        nodupes: true
    });
}
pattern$1.expandBraceExpansion = expandBraceExpansion;
function getPatternParts(pattern, options) {
    let { parts } = micromatch.scan(pattern, Object.assign(Object.assign({}, options), { parts: true }));
    /**
     * The scan method returns an empty array in some cases.
     * See micromatch/picomatch#58 for more details.
     */
    if (parts.length === 0) {
        parts = [pattern];
    }
    /**
     * The scan method does not return an empty part for the pattern with a forward slash.
     * This is another part of micromatch/picomatch#58.
     */
    if (parts[0].startsWith('/')) {
        parts[0] = parts[0].slice(1);
        parts.unshift('');
    }
    return parts;
}
pattern$1.getPatternParts = getPatternParts;
function makeRe(pattern, options) {
    return micromatch.makeRe(pattern, options);
}
pattern$1.makeRe = makeRe;
function convertPatternsToRe(patterns, options) {
    return patterns.map((pattern) => makeRe(pattern, options));
}
pattern$1.convertPatternsToRe = convertPatternsToRe;
function matchAny(entry, patternsRe) {
    return patternsRe.some((patternRe) => patternRe.test(entry));
}
pattern$1.matchAny = matchAny;

var stream$4 = {};

Object.defineProperty(stream$4, "__esModule", { value: true });
stream$4.merge = void 0;
const merge2 = merge2_1;
function merge(streams) {
    const mergedStream = merge2(streams);
    streams.forEach((stream) => {
        stream.once('error', (error) => mergedStream.emit('error', error));
    });
    mergedStream.once('close', () => propagateCloseEventToSources(streams));
    mergedStream.once('end', () => propagateCloseEventToSources(streams));
    return mergedStream;
}
stream$4.merge = merge;
function propagateCloseEventToSources(streams) {
    streams.forEach((stream) => stream.emit('close'));
}

var string$1 = {};

Object.defineProperty(string$1, "__esModule", { value: true });
string$1.isEmpty = string$1.isString = void 0;
function isString$1(input) {
    return typeof input === 'string';
}
string$1.isString = isString$1;
function isEmpty(input) {
    return input === '';
}
string$1.isEmpty = isEmpty;

Object.defineProperty(utils$k, "__esModule", { value: true });
utils$k.string = utils$k.stream = utils$k.pattern = utils$k.path = utils$k.fs = utils$k.errno = utils$k.array = void 0;
const array = array$1;
utils$k.array = array;
const errno = errno$1;
utils$k.errno = errno;
const fs$7 = fs$8;
utils$k.fs = fs$7;
const path$5 = path$a;
utils$k.path = path$5;
const pattern = pattern$1;
utils$k.pattern = pattern;
const stream$3 = stream$4;
utils$k.stream = stream$3;
const string = string$1;
utils$k.string = string;

Object.defineProperty(tasks, "__esModule", { value: true });
tasks.convertPatternGroupToTask = tasks.convertPatternGroupsToTasks = tasks.groupPatternsByBaseDirectory = tasks.getNegativePatternsAsPositive = tasks.getPositivePatterns = tasks.convertPatternsToTasks = tasks.generate = void 0;
const utils$a = utils$k;
function generate(patterns, settings) {
    const positivePatterns = getPositivePatterns(patterns);
    const negativePatterns = getNegativePatternsAsPositive(patterns, settings.ignore);
    const staticPatterns = positivePatterns.filter((pattern) => utils$a.pattern.isStaticPattern(pattern, settings));
    const dynamicPatterns = positivePatterns.filter((pattern) => utils$a.pattern.isDynamicPattern(pattern, settings));
    const staticTasks = convertPatternsToTasks(staticPatterns, negativePatterns, /* dynamic */ false);
    const dynamicTasks = convertPatternsToTasks(dynamicPatterns, negativePatterns, /* dynamic */ true);
    return staticTasks.concat(dynamicTasks);
}
tasks.generate = generate;
/**
 * Returns tasks grouped by basic pattern directories.
 *
 * Patterns that can be found inside (`./`) and outside (`../`) the current directory are handled separately.
 * This is necessary because directory traversal starts at the base directory and goes deeper.
 */
function convertPatternsToTasks(positive, negative, dynamic) {
    const tasks = [];
    const patternsOutsideCurrentDirectory = utils$a.pattern.getPatternsOutsideCurrentDirectory(positive);
    const patternsInsideCurrentDirectory = utils$a.pattern.getPatternsInsideCurrentDirectory(positive);
    const outsideCurrentDirectoryGroup = groupPatternsByBaseDirectory(patternsOutsideCurrentDirectory);
    const insideCurrentDirectoryGroup = groupPatternsByBaseDirectory(patternsInsideCurrentDirectory);
    tasks.push(...convertPatternGroupsToTasks(outsideCurrentDirectoryGroup, negative, dynamic));
    /*
     * For the sake of reducing future accesses to the file system, we merge all tasks within the current directory
     * into a global task, if at least one pattern refers to the root (`.`). In this case, the global task covers the rest.
     */
    if ('.' in insideCurrentDirectoryGroup) {
        tasks.push(convertPatternGroupToTask('.', patternsInsideCurrentDirectory, negative, dynamic));
    }
    else {
        tasks.push(...convertPatternGroupsToTasks(insideCurrentDirectoryGroup, negative, dynamic));
    }
    return tasks;
}
tasks.convertPatternsToTasks = convertPatternsToTasks;
function getPositivePatterns(patterns) {
    return utils$a.pattern.getPositivePatterns(patterns);
}
tasks.getPositivePatterns = getPositivePatterns;
function getNegativePatternsAsPositive(patterns, ignore) {
    const negative = utils$a.pattern.getNegativePatterns(patterns).concat(ignore);
    const positive = negative.map(utils$a.pattern.convertToPositivePattern);
    return positive;
}
tasks.getNegativePatternsAsPositive = getNegativePatternsAsPositive;
function groupPatternsByBaseDirectory(patterns) {
    const group = {};
    return patterns.reduce((collection, pattern) => {
        const base = utils$a.pattern.getBaseDirectory(pattern);
        if (base in collection) {
            collection[base].push(pattern);
        }
        else {
            collection[base] = [pattern];
        }
        return collection;
    }, group);
}
tasks.groupPatternsByBaseDirectory = groupPatternsByBaseDirectory;
function convertPatternGroupsToTasks(positive, negative, dynamic) {
    return Object.keys(positive).map((base) => {
        return convertPatternGroupToTask(base, positive[base], negative, dynamic);
    });
}
tasks.convertPatternGroupsToTasks = convertPatternGroupsToTasks;
function convertPatternGroupToTask(base, positive, negative, dynamic) {
    return {
        dynamic,
        positive,
        negative,
        base,
        patterns: [].concat(positive, negative.map(utils$a.pattern.convertToNegativePattern))
    };
}
tasks.convertPatternGroupToTask = convertPatternGroupToTask;

var patterns = {};

Object.defineProperty(patterns, "__esModule", { value: true });
patterns.removeDuplicateSlashes = patterns.transform = void 0;
/**
 * Matches a sequence of two or more consecutive slashes, excluding the first two slashes at the beginning of the string.
 * The latter is due to the presence of the device path at the beginning of the UNC path.
 * @todo rewrite to negative lookbehind with the next major release.
 */
const DOUBLE_SLASH_RE = /(?!^)\/{2,}/g;
function transform(patterns) {
    return patterns.map((pattern) => removeDuplicateSlashes(pattern));
}
patterns.transform = transform;
/**
 * This package only works with forward slashes as a path separator.
 * Because of this, we cannot use the standard `path.normalize` method, because on Windows platform it will use of backslashes.
 */
function removeDuplicateSlashes(pattern) {
    return pattern.replace(DOUBLE_SLASH_RE, '/');
}
patterns.removeDuplicateSlashes = removeDuplicateSlashes;

var async$6 = {};

var stream$2 = {};

var out$3 = {};

var async$5 = {};

Object.defineProperty(async$5, "__esModule", { value: true });
async$5.read = void 0;
function read$3(path, settings, callback) {
    settings.fs.lstat(path, (lstatError, lstat) => {
        if (lstatError !== null) {
            callFailureCallback$2(callback, lstatError);
            return;
        }
        if (!lstat.isSymbolicLink() || !settings.followSymbolicLink) {
            callSuccessCallback$2(callback, lstat);
            return;
        }
        settings.fs.stat(path, (statError, stat) => {
            if (statError !== null) {
                if (settings.throwErrorOnBrokenSymbolicLink) {
                    callFailureCallback$2(callback, statError);
                    return;
                }
                callSuccessCallback$2(callback, lstat);
                return;
            }
            if (settings.markSymbolicLink) {
                stat.isSymbolicLink = () => true;
            }
            callSuccessCallback$2(callback, stat);
        });
    });
}
async$5.read = read$3;
function callFailureCallback$2(callback, error) {
    callback(error);
}
function callSuccessCallback$2(callback, result) {
    callback(null, result);
}

var sync$7 = {};

Object.defineProperty(sync$7, "__esModule", { value: true });
sync$7.read = void 0;
function read$2(path, settings) {
    const lstat = settings.fs.lstatSync(path);
    if (!lstat.isSymbolicLink() || !settings.followSymbolicLink) {
        return lstat;
    }
    try {
        const stat = settings.fs.statSync(path);
        if (settings.markSymbolicLink) {
            stat.isSymbolicLink = () => true;
        }
        return stat;
    }
    catch (error) {
        if (!settings.throwErrorOnBrokenSymbolicLink) {
            return lstat;
        }
        throw error;
    }
}
sync$7.read = read$2;

var settings$3 = {};

var fs$6 = {};

(function (exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFileSystemAdapter = exports.FILE_SYSTEM_ADAPTER = void 0;
const fs = require$$0$2;
exports.FILE_SYSTEM_ADAPTER = {
    lstat: fs.lstat,
    stat: fs.stat,
    lstatSync: fs.lstatSync,
    statSync: fs.statSync
};
function createFileSystemAdapter(fsMethods) {
    if (fsMethods === undefined) {
        return exports.FILE_SYSTEM_ADAPTER;
    }
    return Object.assign(Object.assign({}, exports.FILE_SYSTEM_ADAPTER), fsMethods);
}
exports.createFileSystemAdapter = createFileSystemAdapter;
}(fs$6));

Object.defineProperty(settings$3, "__esModule", { value: true });
const fs$5 = fs$6;
class Settings$2 {
    constructor(_options = {}) {
        this._options = _options;
        this.followSymbolicLink = this._getValue(this._options.followSymbolicLink, true);
        this.fs = fs$5.createFileSystemAdapter(this._options.fs);
        this.markSymbolicLink = this._getValue(this._options.markSymbolicLink, false);
        this.throwErrorOnBrokenSymbolicLink = this._getValue(this._options.throwErrorOnBrokenSymbolicLink, true);
    }
    _getValue(option, value) {
        return option !== null && option !== void 0 ? option : value;
    }
}
settings$3.default = Settings$2;

Object.defineProperty(out$3, "__esModule", { value: true });
out$3.statSync = out$3.stat = out$3.Settings = void 0;
const async$4 = async$5;
const sync$6 = sync$7;
const settings_1$3 = settings$3;
out$3.Settings = settings_1$3.default;
function stat(path, optionsOrSettingsOrCallback, callback) {
    if (typeof optionsOrSettingsOrCallback === 'function') {
        async$4.read(path, getSettings$2(), optionsOrSettingsOrCallback);
        return;
    }
    async$4.read(path, getSettings$2(optionsOrSettingsOrCallback), callback);
}
out$3.stat = stat;
function statSync(path, optionsOrSettings) {
    const settings = getSettings$2(optionsOrSettings);
    return sync$6.read(path, settings);
}
out$3.statSync = statSync;
function getSettings$2(settingsOrOptions = {}) {
    if (settingsOrOptions instanceof settings_1$3.default) {
        return settingsOrOptions;
    }
    return new settings_1$3.default(settingsOrOptions);
}

var out$2 = {};

var async$3 = {};

var async$2 = {};

var out$1 = {};

var async$1 = {};

/*! queue-microtask. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */

let promise;

var queueMicrotask_1 = typeof queueMicrotask === 'function'
  ? queueMicrotask.bind(typeof window !== 'undefined' ? window : commonjsGlobal)
  // reuse resolved promise, and allocate it lazily
  : cb => (promise || (promise = Promise.resolve()))
    .then(cb)
    .catch(err => setTimeout(() => { throw err }, 0));

/*! run-parallel. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */

var runParallel_1 = runParallel;

const queueMicrotask$1 = queueMicrotask_1;

function runParallel (tasks, cb) {
  let results, pending, keys;
  let isSync = true;

  if (Array.isArray(tasks)) {
    results = [];
    pending = tasks.length;
  } else {
    keys = Object.keys(tasks);
    results = {};
    pending = keys.length;
  }

  function done (err) {
    function end () {
      if (cb) cb(err, results);
      cb = null;
    }
    if (isSync) queueMicrotask$1(end);
    else end();
  }

  function each (i, err, result) {
    results[i] = result;
    if (--pending === 0 || err) {
      done(err);
    }
  }

  if (!pending) {
    // empty
    done(null);
  } else if (keys) {
    // object
    keys.forEach(function (key) {
      tasks[key](function (err, result) { each(key, err, result); });
    });
  } else {
    // array
    tasks.forEach(function (task, i) {
      task(function (err, result) { each(i, err, result); });
    });
  }

  isSync = false;
}

var constants = {};

Object.defineProperty(constants, "__esModule", { value: true });
constants.IS_SUPPORT_READDIR_WITH_FILE_TYPES = void 0;
const NODE_PROCESS_VERSION_PARTS = process.versions.node.split('.');
if (NODE_PROCESS_VERSION_PARTS[0] === undefined || NODE_PROCESS_VERSION_PARTS[1] === undefined) {
    throw new Error(`Unexpected behavior. The 'process.versions.node' variable has invalid value: ${process.versions.node}`);
}
const MAJOR_VERSION = Number.parseInt(NODE_PROCESS_VERSION_PARTS[0], 10);
const MINOR_VERSION = Number.parseInt(NODE_PROCESS_VERSION_PARTS[1], 10);
const SUPPORTED_MAJOR_VERSION = 10;
const SUPPORTED_MINOR_VERSION = 10;
const IS_MATCHED_BY_MAJOR = MAJOR_VERSION > SUPPORTED_MAJOR_VERSION;
const IS_MATCHED_BY_MAJOR_AND_MINOR = MAJOR_VERSION === SUPPORTED_MAJOR_VERSION && MINOR_VERSION >= SUPPORTED_MINOR_VERSION;
/**
 * IS `true` for Node.js 10.10 and greater.
 */
constants.IS_SUPPORT_READDIR_WITH_FILE_TYPES = IS_MATCHED_BY_MAJOR || IS_MATCHED_BY_MAJOR_AND_MINOR;

var utils$9 = {};

var fs$4 = {};

Object.defineProperty(fs$4, "__esModule", { value: true });
fs$4.createDirentFromStats = void 0;
class DirentFromStats {
    constructor(name, stats) {
        this.name = name;
        this.isBlockDevice = stats.isBlockDevice.bind(stats);
        this.isCharacterDevice = stats.isCharacterDevice.bind(stats);
        this.isDirectory = stats.isDirectory.bind(stats);
        this.isFIFO = stats.isFIFO.bind(stats);
        this.isFile = stats.isFile.bind(stats);
        this.isSocket = stats.isSocket.bind(stats);
        this.isSymbolicLink = stats.isSymbolicLink.bind(stats);
    }
}
function createDirentFromStats(name, stats) {
    return new DirentFromStats(name, stats);
}
fs$4.createDirentFromStats = createDirentFromStats;

Object.defineProperty(utils$9, "__esModule", { value: true });
utils$9.fs = void 0;
const fs$3 = fs$4;
utils$9.fs = fs$3;

var common$6 = {};

Object.defineProperty(common$6, "__esModule", { value: true });
common$6.joinPathSegments = void 0;
function joinPathSegments$1(a, b, separator) {
    /**
     * The correct handling of cases when the first segment is a root (`/`, `C:/`) or UNC path (`//?/C:/`).
     */
    if (a.endsWith(separator)) {
        return a + b;
    }
    return a + separator + b;
}
common$6.joinPathSegments = joinPathSegments$1;

Object.defineProperty(async$1, "__esModule", { value: true });
async$1.readdir = async$1.readdirWithFileTypes = async$1.read = void 0;
const fsStat$5 = out$3;
const rpl = runParallel_1;
const constants_1$1 = constants;
const utils$8 = utils$9;
const common$5 = common$6;
function read$1(directory, settings, callback) {
    if (!settings.stats && constants_1$1.IS_SUPPORT_READDIR_WITH_FILE_TYPES) {
        readdirWithFileTypes$1(directory, settings, callback);
        return;
    }
    readdir$1(directory, settings, callback);
}
async$1.read = read$1;
function readdirWithFileTypes$1(directory, settings, callback) {
    settings.fs.readdir(directory, { withFileTypes: true }, (readdirError, dirents) => {
        if (readdirError !== null) {
            callFailureCallback$1(callback, readdirError);
            return;
        }
        const entries = dirents.map((dirent) => ({
            dirent,
            name: dirent.name,
            path: common$5.joinPathSegments(directory, dirent.name, settings.pathSegmentSeparator)
        }));
        if (!settings.followSymbolicLinks) {
            callSuccessCallback$1(callback, entries);
            return;
        }
        const tasks = entries.map((entry) => makeRplTaskEntry(entry, settings));
        rpl(tasks, (rplError, rplEntries) => {
            if (rplError !== null) {
                callFailureCallback$1(callback, rplError);
                return;
            }
            callSuccessCallback$1(callback, rplEntries);
        });
    });
}
async$1.readdirWithFileTypes = readdirWithFileTypes$1;
function makeRplTaskEntry(entry, settings) {
    return (done) => {
        if (!entry.dirent.isSymbolicLink()) {
            done(null, entry);
            return;
        }
        settings.fs.stat(entry.path, (statError, stats) => {
            if (statError !== null) {
                if (settings.throwErrorOnBrokenSymbolicLink) {
                    done(statError);
                    return;
                }
                done(null, entry);
                return;
            }
            entry.dirent = utils$8.fs.createDirentFromStats(entry.name, stats);
            done(null, entry);
        });
    };
}
function readdir$1(directory, settings, callback) {
    settings.fs.readdir(directory, (readdirError, names) => {
        if (readdirError !== null) {
            callFailureCallback$1(callback, readdirError);
            return;
        }
        const tasks = names.map((name) => {
            const path = common$5.joinPathSegments(directory, name, settings.pathSegmentSeparator);
            return (done) => {
                fsStat$5.stat(path, settings.fsStatSettings, (error, stats) => {
                    if (error !== null) {
                        done(error);
                        return;
                    }
                    const entry = {
                        name,
                        path,
                        dirent: utils$8.fs.createDirentFromStats(name, stats)
                    };
                    if (settings.stats) {
                        entry.stats = stats;
                    }
                    done(null, entry);
                });
            };
        });
        rpl(tasks, (rplError, entries) => {
            if (rplError !== null) {
                callFailureCallback$1(callback, rplError);
                return;
            }
            callSuccessCallback$1(callback, entries);
        });
    });
}
async$1.readdir = readdir$1;
function callFailureCallback$1(callback, error) {
    callback(error);
}
function callSuccessCallback$1(callback, result) {
    callback(null, result);
}

var sync$5 = {};

Object.defineProperty(sync$5, "__esModule", { value: true });
sync$5.readdir = sync$5.readdirWithFileTypes = sync$5.read = void 0;
const fsStat$4 = out$3;
const constants_1 = constants;
const utils$7 = utils$9;
const common$4 = common$6;
function read(directory, settings) {
    if (!settings.stats && constants_1.IS_SUPPORT_READDIR_WITH_FILE_TYPES) {
        return readdirWithFileTypes(directory, settings);
    }
    return readdir(directory, settings);
}
sync$5.read = read;
function readdirWithFileTypes(directory, settings) {
    const dirents = settings.fs.readdirSync(directory, { withFileTypes: true });
    return dirents.map((dirent) => {
        const entry = {
            dirent,
            name: dirent.name,
            path: common$4.joinPathSegments(directory, dirent.name, settings.pathSegmentSeparator)
        };
        if (entry.dirent.isSymbolicLink() && settings.followSymbolicLinks) {
            try {
                const stats = settings.fs.statSync(entry.path);
                entry.dirent = utils$7.fs.createDirentFromStats(entry.name, stats);
            }
            catch (error) {
                if (settings.throwErrorOnBrokenSymbolicLink) {
                    throw error;
                }
            }
        }
        return entry;
    });
}
sync$5.readdirWithFileTypes = readdirWithFileTypes;
function readdir(directory, settings) {
    const names = settings.fs.readdirSync(directory);
    return names.map((name) => {
        const entryPath = common$4.joinPathSegments(directory, name, settings.pathSegmentSeparator);
        const stats = fsStat$4.statSync(entryPath, settings.fsStatSettings);
        const entry = {
            name,
            path: entryPath,
            dirent: utils$7.fs.createDirentFromStats(name, stats)
        };
        if (settings.stats) {
            entry.stats = stats;
        }
        return entry;
    });
}
sync$5.readdir = readdir;

var settings$2 = {};

var fs$2 = {};

(function (exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFileSystemAdapter = exports.FILE_SYSTEM_ADAPTER = void 0;
const fs = require$$0$2;
exports.FILE_SYSTEM_ADAPTER = {
    lstat: fs.lstat,
    stat: fs.stat,
    lstatSync: fs.lstatSync,
    statSync: fs.statSync,
    readdir: fs.readdir,
    readdirSync: fs.readdirSync
};
function createFileSystemAdapter(fsMethods) {
    if (fsMethods === undefined) {
        return exports.FILE_SYSTEM_ADAPTER;
    }
    return Object.assign(Object.assign({}, exports.FILE_SYSTEM_ADAPTER), fsMethods);
}
exports.createFileSystemAdapter = createFileSystemAdapter;
}(fs$2));

Object.defineProperty(settings$2, "__esModule", { value: true });
const path$4 = require$$0$4;
const fsStat$3 = out$3;
const fs$1 = fs$2;
class Settings$1 {
    constructor(_options = {}) {
        this._options = _options;
        this.followSymbolicLinks = this._getValue(this._options.followSymbolicLinks, false);
        this.fs = fs$1.createFileSystemAdapter(this._options.fs);
        this.pathSegmentSeparator = this._getValue(this._options.pathSegmentSeparator, path$4.sep);
        this.stats = this._getValue(this._options.stats, false);
        this.throwErrorOnBrokenSymbolicLink = this._getValue(this._options.throwErrorOnBrokenSymbolicLink, true);
        this.fsStatSettings = new fsStat$3.Settings({
            followSymbolicLink: this.followSymbolicLinks,
            fs: this.fs,
            throwErrorOnBrokenSymbolicLink: this.throwErrorOnBrokenSymbolicLink
        });
    }
    _getValue(option, value) {
        return option !== null && option !== void 0 ? option : value;
    }
}
settings$2.default = Settings$1;

Object.defineProperty(out$1, "__esModule", { value: true });
out$1.Settings = out$1.scandirSync = out$1.scandir = void 0;
const async = async$1;
const sync$4 = sync$5;
const settings_1$2 = settings$2;
out$1.Settings = settings_1$2.default;
function scandir(path, optionsOrSettingsOrCallback, callback) {
    if (typeof optionsOrSettingsOrCallback === 'function') {
        async.read(path, getSettings$1(), optionsOrSettingsOrCallback);
        return;
    }
    async.read(path, getSettings$1(optionsOrSettingsOrCallback), callback);
}
out$1.scandir = scandir;
function scandirSync(path, optionsOrSettings) {
    const settings = getSettings$1(optionsOrSettings);
    return sync$4.read(path, settings);
}
out$1.scandirSync = scandirSync;
function getSettings$1(settingsOrOptions = {}) {
    if (settingsOrOptions instanceof settings_1$2.default) {
        return settingsOrOptions;
    }
    return new settings_1$2.default(settingsOrOptions);
}

var queue = {exports: {}};

function reusify$1 (Constructor) {
  var head = new Constructor();
  var tail = head;

  function get () {
    var current = head;

    if (current.next) {
      head = current.next;
    } else {
      head = new Constructor();
      tail = head;
    }

    current.next = null;

    return current
  }

  function release (obj) {
    tail.next = obj;
    tail = obj;
  }

  return {
    get: get,
    release: release
  }
}

var reusify_1 = reusify$1;

/* eslint-disable no-var */

var reusify = reusify_1;

function fastqueue (context, worker, concurrency) {
  if (typeof context === 'function') {
    concurrency = worker;
    worker = context;
    context = null;
  }

  if (concurrency < 1) {
    throw new Error('fastqueue concurrency must be greater than 1')
  }

  var cache = reusify(Task);
  var queueHead = null;
  var queueTail = null;
  var _running = 0;
  var errorHandler = null;

  var self = {
    push: push,
    drain: noop,
    saturated: noop,
    pause: pause,
    paused: false,
    concurrency: concurrency,
    running: running,
    resume: resume,
    idle: idle,
    length: length,
    getQueue: getQueue,
    unshift: unshift,
    empty: noop,
    kill: kill,
    killAndDrain: killAndDrain,
    error: error
  };

  return self

  function running () {
    return _running
  }

  function pause () {
    self.paused = true;
  }

  function length () {
    var current = queueHead;
    var counter = 0;

    while (current) {
      current = current.next;
      counter++;
    }

    return counter
  }

  function getQueue () {
    var current = queueHead;
    var tasks = [];

    while (current) {
      tasks.push(current.value);
      current = current.next;
    }

    return tasks
  }

  function resume () {
    if (!self.paused) return
    self.paused = false;
    for (var i = 0; i < self.concurrency; i++) {
      _running++;
      release();
    }
  }

  function idle () {
    return _running === 0 && self.length() === 0
  }

  function push (value, done) {
    var current = cache.get();

    current.context = context;
    current.release = release;
    current.value = value;
    current.callback = done || noop;
    current.errorHandler = errorHandler;

    if (_running === self.concurrency || self.paused) {
      if (queueTail) {
        queueTail.next = current;
        queueTail = current;
      } else {
        queueHead = current;
        queueTail = current;
        self.saturated();
      }
    } else {
      _running++;
      worker.call(context, current.value, current.worked);
    }
  }

  function unshift (value, done) {
    var current = cache.get();

    current.context = context;
    current.release = release;
    current.value = value;
    current.callback = done || noop;

    if (_running === self.concurrency || self.paused) {
      if (queueHead) {
        current.next = queueHead;
        queueHead = current;
      } else {
        queueHead = current;
        queueTail = current;
        self.saturated();
      }
    } else {
      _running++;
      worker.call(context, current.value, current.worked);
    }
  }

  function release (holder) {
    if (holder) {
      cache.release(holder);
    }
    var next = queueHead;
    if (next) {
      if (!self.paused) {
        if (queueTail === queueHead) {
          queueTail = null;
        }
        queueHead = next.next;
        next.next = null;
        worker.call(context, next.value, next.worked);
        if (queueTail === null) {
          self.empty();
        }
      } else {
        _running--;
      }
    } else if (--_running === 0) {
      self.drain();
    }
  }

  function kill () {
    queueHead = null;
    queueTail = null;
    self.drain = noop;
  }

  function killAndDrain () {
    queueHead = null;
    queueTail = null;
    self.drain();
    self.drain = noop;
  }

  function error (handler) {
    errorHandler = handler;
  }
}

function noop () {}

function Task () {
  this.value = null;
  this.callback = noop;
  this.next = null;
  this.release = noop;
  this.context = null;
  this.errorHandler = null;

  var self = this;

  this.worked = function worked (err, result) {
    var callback = self.callback;
    var errorHandler = self.errorHandler;
    var val = self.value;
    self.value = null;
    self.callback = noop;
    if (self.errorHandler) {
      errorHandler(err, val);
    }
    callback.call(self.context, err, result);
    self.release(self);
  };
}

function queueAsPromised (context, worker, concurrency) {
  if (typeof context === 'function') {
    concurrency = worker;
    worker = context;
    context = null;
  }

  function asyncWrapper (arg, cb) {
    worker.call(this, arg)
      .then(function (res) {
        cb(null, res);
      }, cb);
  }

  var queue = fastqueue(context, asyncWrapper, concurrency);

  var pushCb = queue.push;
  var unshiftCb = queue.unshift;

  queue.push = push;
  queue.unshift = unshift;
  queue.drained = drained;

  return queue

  function push (value) {
    var p = new Promise(function (resolve, reject) {
      pushCb(value, function (err, result) {
        if (err) {
          reject(err);
          return
        }
        resolve(result);
      });
    });

    // Let's fork the promise chain to
    // make the error bubble up to the user but
    // not lead to a unhandledRejection
    p.catch(noop);

    return p
  }

  function unshift (value) {
    var p = new Promise(function (resolve, reject) {
      unshiftCb(value, function (err, result) {
        if (err) {
          reject(err);
          return
        }
        resolve(result);
      });
    });

    // Let's fork the promise chain to
    // make the error bubble up to the user but
    // not lead to a unhandledRejection
    p.catch(noop);

    return p
  }

  function drained () {
    var previousDrain = queue.drain;

    var p = new Promise(function (resolve) {
      queue.drain = function () {
        previousDrain();
        resolve();
      };
    });

    return p
  }
}

queue.exports = fastqueue;
queue.exports.promise = queueAsPromised;

var common$3 = {};

Object.defineProperty(common$3, "__esModule", { value: true });
common$3.joinPathSegments = common$3.replacePathSegmentSeparator = common$3.isAppliedFilter = common$3.isFatalError = void 0;
function isFatalError(settings, error) {
    if (settings.errorFilter === null) {
        return true;
    }
    return !settings.errorFilter(error);
}
common$3.isFatalError = isFatalError;
function isAppliedFilter(filter, value) {
    return filter === null || filter(value);
}
common$3.isAppliedFilter = isAppliedFilter;
function replacePathSegmentSeparator(filepath, separator) {
    return filepath.split(/[/\\]/).join(separator);
}
common$3.replacePathSegmentSeparator = replacePathSegmentSeparator;
function joinPathSegments(a, b, separator) {
    if (a === '') {
        return b;
    }
    /**
     * The correct handling of cases when the first segment is a root (`/`, `C:/`) or UNC path (`//?/C:/`).
     */
    if (a.endsWith(separator)) {
        return a + b;
    }
    return a + separator + b;
}
common$3.joinPathSegments = joinPathSegments;

var reader$1 = {};

Object.defineProperty(reader$1, "__esModule", { value: true });
const common$2 = common$3;
class Reader$1 {
    constructor(_root, _settings) {
        this._root = _root;
        this._settings = _settings;
        this._root = common$2.replacePathSegmentSeparator(_root, _settings.pathSegmentSeparator);
    }
}
reader$1.default = Reader$1;

Object.defineProperty(async$2, "__esModule", { value: true });
const events_1 = require$$0$5;
const fsScandir$2 = out$1;
const fastq = queue.exports;
const common$1 = common$3;
const reader_1$3 = reader$1;
class AsyncReader extends reader_1$3.default {
    constructor(_root, _settings) {
        super(_root, _settings);
        this._settings = _settings;
        this._scandir = fsScandir$2.scandir;
        this._emitter = new events_1.EventEmitter();
        this._queue = fastq(this._worker.bind(this), this._settings.concurrency);
        this._isFatalError = false;
        this._isDestroyed = false;
        this._queue.drain = () => {
            if (!this._isFatalError) {
                this._emitter.emit('end');
            }
        };
    }
    read() {
        this._isFatalError = false;
        this._isDestroyed = false;
        setImmediate(() => {
            this._pushToQueue(this._root, this._settings.basePath);
        });
        return this._emitter;
    }
    get isDestroyed() {
        return this._isDestroyed;
    }
    destroy() {
        if (this._isDestroyed) {
            throw new Error('The reader is already destroyed');
        }
        this._isDestroyed = true;
        this._queue.killAndDrain();
    }
    onEntry(callback) {
        this._emitter.on('entry', callback);
    }
    onError(callback) {
        this._emitter.once('error', callback);
    }
    onEnd(callback) {
        this._emitter.once('end', callback);
    }
    _pushToQueue(directory, base) {
        const queueItem = { directory, base };
        this._queue.push(queueItem, (error) => {
            if (error !== null) {
                this._handleError(error);
            }
        });
    }
    _worker(item, done) {
        this._scandir(item.directory, this._settings.fsScandirSettings, (error, entries) => {
            if (error !== null) {
                done(error, undefined);
                return;
            }
            for (const entry of entries) {
                this._handleEntry(entry, item.base);
            }
            done(null, undefined);
        });
    }
    _handleError(error) {
        if (this._isDestroyed || !common$1.isFatalError(this._settings, error)) {
            return;
        }
        this._isFatalError = true;
        this._isDestroyed = true;
        this._emitter.emit('error', error);
    }
    _handleEntry(entry, base) {
        if (this._isDestroyed || this._isFatalError) {
            return;
        }
        const fullpath = entry.path;
        if (base !== undefined) {
            entry.path = common$1.joinPathSegments(base, entry.name, this._settings.pathSegmentSeparator);
        }
        if (common$1.isAppliedFilter(this._settings.entryFilter, entry)) {
            this._emitEntry(entry);
        }
        if (entry.dirent.isDirectory() && common$1.isAppliedFilter(this._settings.deepFilter, entry)) {
            this._pushToQueue(fullpath, base === undefined ? undefined : entry.path);
        }
    }
    _emitEntry(entry) {
        this._emitter.emit('entry', entry);
    }
}
async$2.default = AsyncReader;

Object.defineProperty(async$3, "__esModule", { value: true });
const async_1$3 = async$2;
class AsyncProvider {
    constructor(_root, _settings) {
        this._root = _root;
        this._settings = _settings;
        this._reader = new async_1$3.default(this._root, this._settings);
        this._storage = [];
    }
    read(callback) {
        this._reader.onError((error) => {
            callFailureCallback(callback, error);
        });
        this._reader.onEntry((entry) => {
            this._storage.push(entry);
        });
        this._reader.onEnd(() => {
            callSuccessCallback(callback, this._storage);
        });
        this._reader.read();
    }
}
async$3.default = AsyncProvider;
function callFailureCallback(callback, error) {
    callback(error);
}
function callSuccessCallback(callback, entries) {
    callback(null, entries);
}

var stream$1 = {};

Object.defineProperty(stream$1, "__esModule", { value: true });
const stream_1$5 = require$$0$1;
const async_1$2 = async$2;
class StreamProvider {
    constructor(_root, _settings) {
        this._root = _root;
        this._settings = _settings;
        this._reader = new async_1$2.default(this._root, this._settings);
        this._stream = new stream_1$5.Readable({
            objectMode: true,
            read: () => { },
            destroy: () => {
                if (!this._reader.isDestroyed) {
                    this._reader.destroy();
                }
            }
        });
    }
    read() {
        this._reader.onError((error) => {
            this._stream.emit('error', error);
        });
        this._reader.onEntry((entry) => {
            this._stream.push(entry);
        });
        this._reader.onEnd(() => {
            this._stream.push(null);
        });
        this._reader.read();
        return this._stream;
    }
}
stream$1.default = StreamProvider;

var sync$3 = {};

var sync$2 = {};

Object.defineProperty(sync$2, "__esModule", { value: true });
const fsScandir$1 = out$1;
const common = common$3;
const reader_1$2 = reader$1;
class SyncReader extends reader_1$2.default {
    constructor() {
        super(...arguments);
        this._scandir = fsScandir$1.scandirSync;
        this._storage = [];
        this._queue = new Set();
    }
    read() {
        this._pushToQueue(this._root, this._settings.basePath);
        this._handleQueue();
        return this._storage;
    }
    _pushToQueue(directory, base) {
        this._queue.add({ directory, base });
    }
    _handleQueue() {
        for (const item of this._queue.values()) {
            this._handleDirectory(item.directory, item.base);
        }
    }
    _handleDirectory(directory, base) {
        try {
            const entries = this._scandir(directory, this._settings.fsScandirSettings);
            for (const entry of entries) {
                this._handleEntry(entry, base);
            }
        }
        catch (error) {
            this._handleError(error);
        }
    }
    _handleError(error) {
        if (!common.isFatalError(this._settings, error)) {
            return;
        }
        throw error;
    }
    _handleEntry(entry, base) {
        const fullpath = entry.path;
        if (base !== undefined) {
            entry.path = common.joinPathSegments(base, entry.name, this._settings.pathSegmentSeparator);
        }
        if (common.isAppliedFilter(this._settings.entryFilter, entry)) {
            this._pushToStorage(entry);
        }
        if (entry.dirent.isDirectory() && common.isAppliedFilter(this._settings.deepFilter, entry)) {
            this._pushToQueue(fullpath, base === undefined ? undefined : entry.path);
        }
    }
    _pushToStorage(entry) {
        this._storage.push(entry);
    }
}
sync$2.default = SyncReader;

Object.defineProperty(sync$3, "__esModule", { value: true });
const sync_1$3 = sync$2;
class SyncProvider {
    constructor(_root, _settings) {
        this._root = _root;
        this._settings = _settings;
        this._reader = new sync_1$3.default(this._root, this._settings);
    }
    read() {
        return this._reader.read();
    }
}
sync$3.default = SyncProvider;

var settings$1 = {};

Object.defineProperty(settings$1, "__esModule", { value: true });
const path$3 = require$$0$4;
const fsScandir = out$1;
class Settings {
    constructor(_options = {}) {
        this._options = _options;
        this.basePath = this._getValue(this._options.basePath, undefined);
        this.concurrency = this._getValue(this._options.concurrency, Number.POSITIVE_INFINITY);
        this.deepFilter = this._getValue(this._options.deepFilter, null);
        this.entryFilter = this._getValue(this._options.entryFilter, null);
        this.errorFilter = this._getValue(this._options.errorFilter, null);
        this.pathSegmentSeparator = this._getValue(this._options.pathSegmentSeparator, path$3.sep);
        this.fsScandirSettings = new fsScandir.Settings({
            followSymbolicLinks: this._options.followSymbolicLinks,
            fs: this._options.fs,
            pathSegmentSeparator: this._options.pathSegmentSeparator,
            stats: this._options.stats,
            throwErrorOnBrokenSymbolicLink: this._options.throwErrorOnBrokenSymbolicLink
        });
    }
    _getValue(option, value) {
        return option !== null && option !== void 0 ? option : value;
    }
}
settings$1.default = Settings;

Object.defineProperty(out$2, "__esModule", { value: true });
out$2.Settings = out$2.walkStream = out$2.walkSync = out$2.walk = void 0;
const async_1$1 = async$3;
const stream_1$4 = stream$1;
const sync_1$2 = sync$3;
const settings_1$1 = settings$1;
out$2.Settings = settings_1$1.default;
function walk(directory, optionsOrSettingsOrCallback, callback) {
    if (typeof optionsOrSettingsOrCallback === 'function') {
        new async_1$1.default(directory, getSettings()).read(optionsOrSettingsOrCallback);
        return;
    }
    new async_1$1.default(directory, getSettings(optionsOrSettingsOrCallback)).read(callback);
}
out$2.walk = walk;
function walkSync(directory, optionsOrSettings) {
    const settings = getSettings(optionsOrSettings);
    const provider = new sync_1$2.default(directory, settings);
    return provider.read();
}
out$2.walkSync = walkSync;
function walkStream(directory, optionsOrSettings) {
    const settings = getSettings(optionsOrSettings);
    const provider = new stream_1$4.default(directory, settings);
    return provider.read();
}
out$2.walkStream = walkStream;
function getSettings(settingsOrOptions = {}) {
    if (settingsOrOptions instanceof settings_1$1.default) {
        return settingsOrOptions;
    }
    return new settings_1$1.default(settingsOrOptions);
}

var reader = {};

Object.defineProperty(reader, "__esModule", { value: true });
const path$2 = require$$0$4;
const fsStat$2 = out$3;
const utils$6 = utils$k;
class Reader {
    constructor(_settings) {
        this._settings = _settings;
        this._fsStatSettings = new fsStat$2.Settings({
            followSymbolicLink: this._settings.followSymbolicLinks,
            fs: this._settings.fs,
            throwErrorOnBrokenSymbolicLink: this._settings.followSymbolicLinks
        });
    }
    _getFullEntryPath(filepath) {
        return path$2.resolve(this._settings.cwd, filepath);
    }
    _makeEntry(stats, pattern) {
        const entry = {
            name: pattern,
            path: pattern,
            dirent: utils$6.fs.createDirentFromStats(pattern, stats)
        };
        if (this._settings.stats) {
            entry.stats = stats;
        }
        return entry;
    }
    _isFatalError(error) {
        return !utils$6.errno.isEnoentCodeError(error) && !this._settings.suppressErrors;
    }
}
reader.default = Reader;

Object.defineProperty(stream$2, "__esModule", { value: true });
const stream_1$3 = require$$0$1;
const fsStat$1 = out$3;
const fsWalk$1 = out$2;
const reader_1$1 = reader;
class ReaderStream extends reader_1$1.default {
    constructor() {
        super(...arguments);
        this._walkStream = fsWalk$1.walkStream;
        this._stat = fsStat$1.stat;
    }
    dynamic(root, options) {
        return this._walkStream(root, options);
    }
    static(patterns, options) {
        const filepaths = patterns.map(this._getFullEntryPath, this);
        const stream = new stream_1$3.PassThrough({ objectMode: true });
        stream._write = (index, _enc, done) => {
            return this._getEntry(filepaths[index], patterns[index], options)
                .then((entry) => {
                if (entry !== null && options.entryFilter(entry)) {
                    stream.push(entry);
                }
                if (index === filepaths.length - 1) {
                    stream.end();
                }
                done();
            })
                .catch(done);
        };
        for (let i = 0; i < filepaths.length; i++) {
            stream.write(i);
        }
        return stream;
    }
    _getEntry(filepath, pattern, options) {
        return this._getStat(filepath)
            .then((stats) => this._makeEntry(stats, pattern))
            .catch((error) => {
            if (options.errorFilter(error)) {
                return null;
            }
            throw error;
        });
    }
    _getStat(filepath) {
        return new Promise((resolve, reject) => {
            this._stat(filepath, this._fsStatSettings, (error, stats) => {
                return error === null ? resolve(stats) : reject(error);
            });
        });
    }
}
stream$2.default = ReaderStream;

var provider = {};

var deep = {};

var partial = {};

var matcher = {};

Object.defineProperty(matcher, "__esModule", { value: true });
const utils$5 = utils$k;
class Matcher {
    constructor(_patterns, _settings, _micromatchOptions) {
        this._patterns = _patterns;
        this._settings = _settings;
        this._micromatchOptions = _micromatchOptions;
        this._storage = [];
        this._fillStorage();
    }
    _fillStorage() {
        /**
         * The original pattern may include `{,*,**,a/*}`, which will lead to problems with matching (unresolved level).
         * So, before expand patterns with brace expansion into separated patterns.
         */
        const patterns = utils$5.pattern.expandPatternsWithBraceExpansion(this._patterns);
        for (const pattern of patterns) {
            const segments = this._getPatternSegments(pattern);
            const sections = this._splitSegmentsIntoSections(segments);
            this._storage.push({
                complete: sections.length <= 1,
                pattern,
                segments,
                sections
            });
        }
    }
    _getPatternSegments(pattern) {
        const parts = utils$5.pattern.getPatternParts(pattern, this._micromatchOptions);
        return parts.map((part) => {
            const dynamic = utils$5.pattern.isDynamicPattern(part, this._settings);
            if (!dynamic) {
                return {
                    dynamic: false,
                    pattern: part
                };
            }
            return {
                dynamic: true,
                pattern: part,
                patternRe: utils$5.pattern.makeRe(part, this._micromatchOptions)
            };
        });
    }
    _splitSegmentsIntoSections(segments) {
        return utils$5.array.splitWhen(segments, (segment) => segment.dynamic && utils$5.pattern.hasGlobStar(segment.pattern));
    }
}
matcher.default = Matcher;

Object.defineProperty(partial, "__esModule", { value: true });
const matcher_1 = matcher;
class PartialMatcher extends matcher_1.default {
    match(filepath) {
        const parts = filepath.split('/');
        const levels = parts.length;
        const patterns = this._storage.filter((info) => !info.complete || info.segments.length > levels);
        for (const pattern of patterns) {
            const section = pattern.sections[0];
            /**
             * In this case, the pattern has a globstar and we must read all directories unconditionally,
             * but only if the level has reached the end of the first group.
             *
             * fixtures/{a,b}/**
             *  ^ true/false  ^ always true
            */
            if (!pattern.complete && levels > section.length) {
                return true;
            }
            const match = parts.every((part, index) => {
                const segment = pattern.segments[index];
                if (segment.dynamic && segment.patternRe.test(part)) {
                    return true;
                }
                if (!segment.dynamic && segment.pattern === part) {
                    return true;
                }
                return false;
            });
            if (match) {
                return true;
            }
        }
        return false;
    }
}
partial.default = PartialMatcher;

Object.defineProperty(deep, "__esModule", { value: true });
const utils$4 = utils$k;
const partial_1 = partial;
class DeepFilter {
    constructor(_settings, _micromatchOptions) {
        this._settings = _settings;
        this._micromatchOptions = _micromatchOptions;
    }
    getFilter(basePath, positive, negative) {
        const matcher = this._getMatcher(positive);
        const negativeRe = this._getNegativePatternsRe(negative);
        return (entry) => this._filter(basePath, entry, matcher, negativeRe);
    }
    _getMatcher(patterns) {
        return new partial_1.default(patterns, this._settings, this._micromatchOptions);
    }
    _getNegativePatternsRe(patterns) {
        const affectDepthOfReadingPatterns = patterns.filter(utils$4.pattern.isAffectDepthOfReadingPattern);
        return utils$4.pattern.convertPatternsToRe(affectDepthOfReadingPatterns, this._micromatchOptions);
    }
    _filter(basePath, entry, matcher, negativeRe) {
        if (this._isSkippedByDeep(basePath, entry.path)) {
            return false;
        }
        if (this._isSkippedSymbolicLink(entry)) {
            return false;
        }
        const filepath = utils$4.path.removeLeadingDotSegment(entry.path);
        if (this._isSkippedByPositivePatterns(filepath, matcher)) {
            return false;
        }
        return this._isSkippedByNegativePatterns(filepath, negativeRe);
    }
    _isSkippedByDeep(basePath, entryPath) {
        /**
         * Avoid unnecessary depth calculations when it doesn't matter.
         */
        if (this._settings.deep === Infinity) {
            return false;
        }
        return this._getEntryLevel(basePath, entryPath) >= this._settings.deep;
    }
    _getEntryLevel(basePath, entryPath) {
        const entryPathDepth = entryPath.split('/').length;
        if (basePath === '') {
            return entryPathDepth;
        }
        const basePathDepth = basePath.split('/').length;
        return entryPathDepth - basePathDepth;
    }
    _isSkippedSymbolicLink(entry) {
        return !this._settings.followSymbolicLinks && entry.dirent.isSymbolicLink();
    }
    _isSkippedByPositivePatterns(entryPath, matcher) {
        return !this._settings.baseNameMatch && !matcher.match(entryPath);
    }
    _isSkippedByNegativePatterns(entryPath, patternsRe) {
        return !utils$4.pattern.matchAny(entryPath, patternsRe);
    }
}
deep.default = DeepFilter;

var entry$1 = {};

Object.defineProperty(entry$1, "__esModule", { value: true });
const utils$3 = utils$k;
class EntryFilter {
    constructor(_settings, _micromatchOptions) {
        this._settings = _settings;
        this._micromatchOptions = _micromatchOptions;
        this.index = new Map();
    }
    getFilter(positive, negative) {
        const positiveRe = utils$3.pattern.convertPatternsToRe(positive, this._micromatchOptions);
        const negativeRe = utils$3.pattern.convertPatternsToRe(negative, this._micromatchOptions);
        return (entry) => this._filter(entry, positiveRe, negativeRe);
    }
    _filter(entry, positiveRe, negativeRe) {
        if (this._settings.unique && this._isDuplicateEntry(entry)) {
            return false;
        }
        if (this._onlyFileFilter(entry) || this._onlyDirectoryFilter(entry)) {
            return false;
        }
        if (this._isSkippedByAbsoluteNegativePatterns(entry.path, negativeRe)) {
            return false;
        }
        const filepath = this._settings.baseNameMatch ? entry.name : entry.path;
        const isMatched = this._isMatchToPatterns(filepath, positiveRe) && !this._isMatchToPatterns(entry.path, negativeRe);
        if (this._settings.unique && isMatched) {
            this._createIndexRecord(entry);
        }
        return isMatched;
    }
    _isDuplicateEntry(entry) {
        return this.index.has(entry.path);
    }
    _createIndexRecord(entry) {
        this.index.set(entry.path, undefined);
    }
    _onlyFileFilter(entry) {
        return this._settings.onlyFiles && !entry.dirent.isFile();
    }
    _onlyDirectoryFilter(entry) {
        return this._settings.onlyDirectories && !entry.dirent.isDirectory();
    }
    _isSkippedByAbsoluteNegativePatterns(entryPath, patternsRe) {
        if (!this._settings.absolute) {
            return false;
        }
        const fullpath = utils$3.path.makeAbsolute(this._settings.cwd, entryPath);
        return utils$3.pattern.matchAny(fullpath, patternsRe);
    }
    /**
     * First, just trying to apply patterns to the path.
     * Second, trying to apply patterns to the path with final slash.
     */
    _isMatchToPatterns(entryPath, patternsRe) {
        const filepath = utils$3.path.removeLeadingDotSegment(entryPath);
        return utils$3.pattern.matchAny(filepath, patternsRe) || utils$3.pattern.matchAny(filepath + '/', patternsRe);
    }
}
entry$1.default = EntryFilter;

var error = {};

Object.defineProperty(error, "__esModule", { value: true });
const utils$2 = utils$k;
class ErrorFilter {
    constructor(_settings) {
        this._settings = _settings;
    }
    getFilter() {
        return (error) => this._isNonFatalError(error);
    }
    _isNonFatalError(error) {
        return utils$2.errno.isEnoentCodeError(error) || this._settings.suppressErrors;
    }
}
error.default = ErrorFilter;

var entry = {};

Object.defineProperty(entry, "__esModule", { value: true });
const utils$1 = utils$k;
class EntryTransformer {
    constructor(_settings) {
        this._settings = _settings;
    }
    getTransformer() {
        return (entry) => this._transform(entry);
    }
    _transform(entry) {
        let filepath = entry.path;
        if (this._settings.absolute) {
            filepath = utils$1.path.makeAbsolute(this._settings.cwd, filepath);
            filepath = utils$1.path.unixify(filepath);
        }
        if (this._settings.markDirectories && entry.dirent.isDirectory()) {
            filepath += '/';
        }
        if (!this._settings.objectMode) {
            return filepath;
        }
        return Object.assign(Object.assign({}, entry), { path: filepath });
    }
}
entry.default = EntryTransformer;

Object.defineProperty(provider, "__esModule", { value: true });
const path$1 = require$$0$4;
const deep_1 = deep;
const entry_1 = entry$1;
const error_1 = error;
const entry_2 = entry;
class Provider {
    constructor(_settings) {
        this._settings = _settings;
        this.errorFilter = new error_1.default(this._settings);
        this.entryFilter = new entry_1.default(this._settings, this._getMicromatchOptions());
        this.deepFilter = new deep_1.default(this._settings, this._getMicromatchOptions());
        this.entryTransformer = new entry_2.default(this._settings);
    }
    _getRootDirectory(task) {
        return path$1.resolve(this._settings.cwd, task.base);
    }
    _getReaderOptions(task) {
        const basePath = task.base === '.' ? '' : task.base;
        return {
            basePath,
            pathSegmentSeparator: '/',
            concurrency: this._settings.concurrency,
            deepFilter: this.deepFilter.getFilter(basePath, task.positive, task.negative),
            entryFilter: this.entryFilter.getFilter(task.positive, task.negative),
            errorFilter: this.errorFilter.getFilter(),
            followSymbolicLinks: this._settings.followSymbolicLinks,
            fs: this._settings.fs,
            stats: this._settings.stats,
            throwErrorOnBrokenSymbolicLink: this._settings.throwErrorOnBrokenSymbolicLink,
            transform: this.entryTransformer.getTransformer()
        };
    }
    _getMicromatchOptions() {
        return {
            dot: this._settings.dot,
            matchBase: this._settings.baseNameMatch,
            nobrace: !this._settings.braceExpansion,
            nocase: !this._settings.caseSensitiveMatch,
            noext: !this._settings.extglob,
            noglobstar: !this._settings.globstar,
            posix: true,
            strictSlashes: false
        };
    }
}
provider.default = Provider;

Object.defineProperty(async$6, "__esModule", { value: true });
const stream_1$2 = stream$2;
const provider_1$2 = provider;
class ProviderAsync extends provider_1$2.default {
    constructor() {
        super(...arguments);
        this._reader = new stream_1$2.default(this._settings);
    }
    read(task) {
        const root = this._getRootDirectory(task);
        const options = this._getReaderOptions(task);
        const entries = [];
        return new Promise((resolve, reject) => {
            const stream = this.api(root, task, options);
            stream.once('error', reject);
            stream.on('data', (entry) => entries.push(options.transform(entry)));
            stream.once('end', () => resolve(entries));
        });
    }
    api(root, task, options) {
        if (task.dynamic) {
            return this._reader.dynamic(root, options);
        }
        return this._reader.static(task.patterns, options);
    }
}
async$6.default = ProviderAsync;

var stream = {};

Object.defineProperty(stream, "__esModule", { value: true });
const stream_1$1 = require$$0$1;
const stream_2 = stream$2;
const provider_1$1 = provider;
class ProviderStream extends provider_1$1.default {
    constructor() {
        super(...arguments);
        this._reader = new stream_2.default(this._settings);
    }
    read(task) {
        const root = this._getRootDirectory(task);
        const options = this._getReaderOptions(task);
        const source = this.api(root, task, options);
        const destination = new stream_1$1.Readable({ objectMode: true, read: () => { } });
        source
            .once('error', (error) => destination.emit('error', error))
            .on('data', (entry) => destination.emit('data', options.transform(entry)))
            .once('end', () => destination.emit('end'));
        destination
            .once('close', () => source.destroy());
        return destination;
    }
    api(root, task, options) {
        if (task.dynamic) {
            return this._reader.dynamic(root, options);
        }
        return this._reader.static(task.patterns, options);
    }
}
stream.default = ProviderStream;

var sync$1 = {};

var sync = {};

Object.defineProperty(sync, "__esModule", { value: true });
const fsStat = out$3;
const fsWalk = out$2;
const reader_1 = reader;
class ReaderSync extends reader_1.default {
    constructor() {
        super(...arguments);
        this._walkSync = fsWalk.walkSync;
        this._statSync = fsStat.statSync;
    }
    dynamic(root, options) {
        return this._walkSync(root, options);
    }
    static(patterns, options) {
        const entries = [];
        for (const pattern of patterns) {
            const filepath = this._getFullEntryPath(pattern);
            const entry = this._getEntry(filepath, pattern, options);
            if (entry === null || !options.entryFilter(entry)) {
                continue;
            }
            entries.push(entry);
        }
        return entries;
    }
    _getEntry(filepath, pattern, options) {
        try {
            const stats = this._getStat(filepath);
            return this._makeEntry(stats, pattern);
        }
        catch (error) {
            if (options.errorFilter(error)) {
                return null;
            }
            throw error;
        }
    }
    _getStat(filepath) {
        return this._statSync(filepath, this._fsStatSettings);
    }
}
sync.default = ReaderSync;

Object.defineProperty(sync$1, "__esModule", { value: true });
const sync_1$1 = sync;
const provider_1 = provider;
class ProviderSync extends provider_1.default {
    constructor() {
        super(...arguments);
        this._reader = new sync_1$1.default(this._settings);
    }
    read(task) {
        const root = this._getRootDirectory(task);
        const options = this._getReaderOptions(task);
        const entries = this.api(root, task, options);
        return entries.map(options.transform);
    }
    api(root, task, options) {
        if (task.dynamic) {
            return this._reader.dynamic(root, options);
        }
        return this._reader.static(task.patterns, options);
    }
}
sync$1.default = ProviderSync;

var settings = {};

(function (exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_FILE_SYSTEM_ADAPTER = void 0;
const fs = require$$0$2;
const os = require$$2;
/**
 * The `os.cpus` method can return zero. We expect the number of cores to be greater than zero.
 * https://github.com/nodejs/node/blob/7faeddf23a98c53896f8b574a6e66589e8fb1eb8/lib/os.js#L106-L107
 */
const CPU_COUNT = Math.max(os.cpus().length, 1);
exports.DEFAULT_FILE_SYSTEM_ADAPTER = {
    lstat: fs.lstat,
    lstatSync: fs.lstatSync,
    stat: fs.stat,
    statSync: fs.statSync,
    readdir: fs.readdir,
    readdirSync: fs.readdirSync
};
class Settings {
    constructor(_options = {}) {
        this._options = _options;
        this.absolute = this._getValue(this._options.absolute, false);
        this.baseNameMatch = this._getValue(this._options.baseNameMatch, false);
        this.braceExpansion = this._getValue(this._options.braceExpansion, true);
        this.caseSensitiveMatch = this._getValue(this._options.caseSensitiveMatch, true);
        this.concurrency = this._getValue(this._options.concurrency, CPU_COUNT);
        this.cwd = this._getValue(this._options.cwd, process.cwd());
        this.deep = this._getValue(this._options.deep, Infinity);
        this.dot = this._getValue(this._options.dot, false);
        this.extglob = this._getValue(this._options.extglob, true);
        this.followSymbolicLinks = this._getValue(this._options.followSymbolicLinks, true);
        this.fs = this._getFileSystemMethods(this._options.fs);
        this.globstar = this._getValue(this._options.globstar, true);
        this.ignore = this._getValue(this._options.ignore, []);
        this.markDirectories = this._getValue(this._options.markDirectories, false);
        this.objectMode = this._getValue(this._options.objectMode, false);
        this.onlyDirectories = this._getValue(this._options.onlyDirectories, false);
        this.onlyFiles = this._getValue(this._options.onlyFiles, true);
        this.stats = this._getValue(this._options.stats, false);
        this.suppressErrors = this._getValue(this._options.suppressErrors, false);
        this.throwErrorOnBrokenSymbolicLink = this._getValue(this._options.throwErrorOnBrokenSymbolicLink, false);
        this.unique = this._getValue(this._options.unique, true);
        if (this.onlyDirectories) {
            this.onlyFiles = false;
        }
        if (this.stats) {
            this.objectMode = true;
        }
    }
    _getValue(option, value) {
        return option === undefined ? value : option;
    }
    _getFileSystemMethods(methods = {}) {
        return Object.assign(Object.assign({}, exports.DEFAULT_FILE_SYSTEM_ADAPTER), methods);
    }
}
exports.default = Settings;
}(settings));

const taskManager = tasks;
const patternManager = patterns;
const async_1 = async$6;
const stream_1 = stream;
const sync_1 = sync$1;
const settings_1 = settings;
const utils = utils$k;
async function FastGlob(source, options) {
    assertPatternsInput$1(source);
    const works = getWorks(source, async_1.default, options);
    const result = await Promise.all(works);
    return utils.array.flatten(result);
}
// https://github.com/typescript-eslint/typescript-eslint/issues/60
// eslint-disable-next-line no-redeclare
(function (FastGlob) {
    function sync(source, options) {
        assertPatternsInput$1(source);
        const works = getWorks(source, sync_1.default, options);
        return utils.array.flatten(works);
    }
    FastGlob.sync = sync;
    function stream(source, options) {
        assertPatternsInput$1(source);
        const works = getWorks(source, stream_1.default, options);
        /**
         * The stream returned by the provider cannot work with an asynchronous iterator.
         * To support asynchronous iterators, regardless of the number of tasks, we always multiplex streams.
         * This affects performance (+25%). I don't see best solution right now.
         */
        return utils.stream.merge(works);
    }
    FastGlob.stream = stream;
    function generateTasks(source, options) {
        assertPatternsInput$1(source);
        const patterns = patternManager.transform([].concat(source));
        const settings = new settings_1.default(options);
        return taskManager.generate(patterns, settings);
    }
    FastGlob.generateTasks = generateTasks;
    function isDynamicPattern(source, options) {
        assertPatternsInput$1(source);
        const settings = new settings_1.default(options);
        return utils.pattern.isDynamicPattern(source, settings);
    }
    FastGlob.isDynamicPattern = isDynamicPattern;
    function escapePath(source) {
        assertPatternsInput$1(source);
        return utils.path.escape(source);
    }
    FastGlob.escapePath = escapePath;
})(FastGlob || (FastGlob = {}));
function getWorks(source, _Provider, options) {
    const patterns = patternManager.transform([].concat(source));
    const settings = new settings_1.default(options);
    const tasks = taskManager.generate(patterns, settings);
    const provider = new _Provider(settings);
    return tasks.map(provider.read, provider);
}
function assertPatternsInput$1(input) {
    const source = [].concat(input);
    const isValidSource = source.every((item) => utils.string.isString(item) && !utils.string.isEmpty(item));
    if (!isValidSource) {
        throw new TypeError('Patterns must be a string (non empty) or an array of strings');
    }
}
var out = FastGlob;

var dirGlob$1 = {exports: {}};

var pathType$1 = {};

const {promisify} = require$$0$3;
const fs = require$$0$2;

async function isType(fsStatType, statsMethodName, filePath) {
	if (typeof filePath !== 'string') {
		throw new TypeError(`Expected a string, got ${typeof filePath}`);
	}

	try {
		const stats = await promisify(fs[fsStatType])(filePath);
		return stats[statsMethodName]();
	} catch (error) {
		if (error.code === 'ENOENT') {
			return false;
		}

		throw error;
	}
}

function isTypeSync(fsStatType, statsMethodName, filePath) {
	if (typeof filePath !== 'string') {
		throw new TypeError(`Expected a string, got ${typeof filePath}`);
	}

	try {
		return fs[fsStatType](filePath)[statsMethodName]();
	} catch (error) {
		if (error.code === 'ENOENT') {
			return false;
		}

		throw error;
	}
}

pathType$1.isFile = isType.bind(null, 'stat', 'isFile');
pathType$1.isDirectory = isType.bind(null, 'stat', 'isDirectory');
pathType$1.isSymlink = isType.bind(null, 'lstat', 'isSymbolicLink');
pathType$1.isFileSync = isTypeSync.bind(null, 'statSync', 'isFile');
pathType$1.isDirectorySync = isTypeSync.bind(null, 'statSync', 'isDirectory');
pathType$1.isSymlinkSync = isTypeSync.bind(null, 'lstatSync', 'isSymbolicLink');

const path = require$$0$4;
const pathType = pathType$1;

const getExtensions = extensions => extensions.length > 1 ? `{${extensions.join(',')}}` : extensions[0];

const getPath = (filepath, cwd) => {
	const pth = filepath[0] === '!' ? filepath.slice(1) : filepath;
	return path.isAbsolute(pth) ? pth : path.join(cwd, pth);
};

const addExtensions = (file, extensions) => {
	if (path.extname(file)) {
		return `**/${file}`;
	}

	return `**/${file}.${getExtensions(extensions)}`;
};

const getGlob = (directory, options) => {
	if (options.files && !Array.isArray(options.files)) {
		throw new TypeError(`Expected \`files\` to be of type \`Array\` but received type \`${typeof options.files}\``);
	}

	if (options.extensions && !Array.isArray(options.extensions)) {
		throw new TypeError(`Expected \`extensions\` to be of type \`Array\` but received type \`${typeof options.extensions}\``);
	}

	if (options.files && options.extensions) {
		return options.files.map(x => path.posix.join(directory, addExtensions(x, options.extensions)));
	}

	if (options.files) {
		return options.files.map(x => path.posix.join(directory, `**/${x}`));
	}

	if (options.extensions) {
		return [path.posix.join(directory, `**/*.${getExtensions(options.extensions)}`)];
	}

	return [path.posix.join(directory, '**')];
};

dirGlob$1.exports = async (input, options) => {
	options = {
		cwd: process.cwd(),
		...options
	};

	if (typeof options.cwd !== 'string') {
		throw new TypeError(`Expected \`cwd\` to be of type \`string\` but received type \`${typeof options.cwd}\``);
	}

	const globs = await Promise.all([].concat(input).map(async x => {
		const isDirectory = await pathType.isDirectory(getPath(x, options.cwd));
		return isDirectory ? getGlob(x, options) : x;
	}));

	return [].concat.apply([], globs); // eslint-disable-line prefer-spread
};

dirGlob$1.exports.sync = (input, options) => {
	options = {
		cwd: process.cwd(),
		...options
	};

	if (typeof options.cwd !== 'string') {
		throw new TypeError(`Expected \`cwd\` to be of type \`string\` but received type \`${typeof options.cwd}\``);
	}

	const globs = [].concat(input).map(x => pathType.isDirectorySync(getPath(x, options.cwd)) ? getGlob(x, options) : x);

	return [].concat.apply([], globs); // eslint-disable-line prefer-spread
};

var dirGlob = dirGlob$1.exports;

// A simple implementation of make-array
function makeArray (subject) {
  return Array.isArray(subject)
    ? subject
    : [subject]
}

const EMPTY = '';
const SPACE = ' ';
const ESCAPE = '\\';
const REGEX_TEST_BLANK_LINE = /^\s+$/;
const REGEX_REPLACE_LEADING_EXCAPED_EXCLAMATION = /^\\!/;
const REGEX_REPLACE_LEADING_EXCAPED_HASH = /^\\#/;
const REGEX_SPLITALL_CRLF = /\r?\n/g;
// /foo,
// ./foo,
// ../foo,
// .
// ..
const REGEX_TEST_INVALID_PATH = /^\.*\/|^\.+$/;

const SLASH = '/';
const KEY_IGNORE = typeof Symbol !== 'undefined'
  ? Symbol.for('node-ignore')
  /* istanbul ignore next */
  : 'node-ignore';

const define = (object, key, value) =>
  Object.defineProperty(object, key, {value});

const REGEX_REGEXP_RANGE = /([0-z])-([0-z])/g;

const RETURN_FALSE = () => false;

// Sanitize the range of a regular expression
// The cases are complicated, see test cases for details
const sanitizeRange = range => range.replace(
  REGEX_REGEXP_RANGE,
  (match, from, to) => from.charCodeAt(0) <= to.charCodeAt(0)
    ? match
    // Invalid range (out of order) which is ok for gitignore rules but
    //   fatal for JavaScript regular expression, so eliminate it.
    : EMPTY
);

// See fixtures #59
const cleanRangeBackSlash = slashes => {
  const {length} = slashes;
  return slashes.slice(0, length - length % 2)
};

// > If the pattern ends with a slash,
// > it is removed for the purpose of the following description,
// > but it would only find a match with a directory.
// > In other words, foo/ will match a directory foo and paths underneath it,
// > but will not match a regular file or a symbolic link foo
// >  (this is consistent with the way how pathspec works in general in Git).
// '`foo/`' will not match regular file '`foo`' or symbolic link '`foo`'
// -> ignore-rules will not deal with it, because it costs extra `fs.stat` call
//      you could use option `mark: true` with `glob`

// '`foo/`' should not continue with the '`..`'
const REPLACERS = [

  // > Trailing spaces are ignored unless they are quoted with backslash ("\")
  [
    // (a\ ) -> (a )
    // (a  ) -> (a)
    // (a \ ) -> (a  )
    /\\?\s+$/,
    match => match.indexOf('\\') === 0
      ? SPACE
      : EMPTY
  ],

  // replace (\ ) with ' '
  [
    /\\\s/g,
    () => SPACE
  ],

  // Escape metacharacters
  // which is written down by users but means special for regular expressions.

  // > There are 12 characters with special meanings:
  // > - the backslash \,
  // > - the caret ^,
  // > - the dollar sign $,
  // > - the period or dot .,
  // > - the vertical bar or pipe symbol |,
  // > - the question mark ?,
  // > - the asterisk or star *,
  // > - the plus sign +,
  // > - the opening parenthesis (,
  // > - the closing parenthesis ),
  // > - and the opening square bracket [,
  // > - the opening curly brace {,
  // > These special characters are often called "metacharacters".
  [
    /[\\$.|*+(){^]/g,
    match => `\\${match}`
  ],

  [
    // > a question mark (?) matches a single character
    /(?!\\)\?/g,
    () => '[^/]'
  ],

  // leading slash
  [

    // > A leading slash matches the beginning of the pathname.
    // > For example, "/*.c" matches "cat-file.c" but not "mozilla-sha1/sha1.c".
    // A leading slash matches the beginning of the pathname
    /^\//,
    () => '^'
  ],

  // replace special metacharacter slash after the leading slash
  [
    /\//g,
    () => '\\/'
  ],

  [
    // > A leading "**" followed by a slash means match in all directories.
    // > For example, "**/foo" matches file or directory "foo" anywhere,
    // > the same as pattern "foo".
    // > "**/foo/bar" matches file or directory "bar" anywhere that is directly
    // >   under directory "foo".
    // Notice that the '*'s have been replaced as '\\*'
    /^\^*\\\*\\\*\\\//,

    // '**/foo' <-> 'foo'
    () => '^(?:.*\\/)?'
  ],

  // starting
  [
    // there will be no leading '/'
    //   (which has been replaced by section "leading slash")
    // If starts with '**', adding a '^' to the regular expression also works
    /^(?=[^^])/,
    function startingReplacer () {
      // If has a slash `/` at the beginning or middle
      return !/\/(?!$)/.test(this)
        // > Prior to 2.22.1
        // > If the pattern does not contain a slash /,
        // >   Git treats it as a shell glob pattern
        // Actually, if there is only a trailing slash,
        //   git also treats it as a shell glob pattern

        // After 2.22.1 (compatible but clearer)
        // > If there is a separator at the beginning or middle (or both)
        // > of the pattern, then the pattern is relative to the directory
        // > level of the particular .gitignore file itself.
        // > Otherwise the pattern may also match at any level below
        // > the .gitignore level.
        ? '(?:^|\\/)'

        // > Otherwise, Git treats the pattern as a shell glob suitable for
        // >   consumption by fnmatch(3)
        : '^'
    }
  ],

  // two globstars
  [
    // Use lookahead assertions so that we could match more than one `'/**'`
    /\\\/\\\*\\\*(?=\\\/|$)/g,

    // Zero, one or several directories
    // should not use '*', or it will be replaced by the next replacer

    // Check if it is not the last `'/**'`
    (_, index, str) => index + 6 < str.length

      // case: /**/
      // > A slash followed by two consecutive asterisks then a slash matches
      // >   zero or more directories.
      // > For example, "a/**/b" matches "a/b", "a/x/b", "a/x/y/b" and so on.
      // '/**/'
      ? '(?:\\/[^\\/]+)*'

      // case: /**
      // > A trailing `"/**"` matches everything inside.

      // #21: everything inside but it should not include the current folder
      : '\\/.+'
  ],

  // intermediate wildcards
  [
    // Never replace escaped '*'
    // ignore rule '\*' will match the path '*'

    // 'abc.*/' -> go
    // 'abc.*'  -> skip this rule
    /(^|[^\\]+)\\\*(?=.+)/g,

    // '*.js' matches '.js'
    // '*.js' doesn't match 'abc'
    (_, p1) => `${p1}[^\\/]*`
  ],

  [
    // unescape, revert step 3 except for back slash
    // For example, if a user escape a '\\*',
    // after step 3, the result will be '\\\\\\*'
    /\\\\\\(?=[$.|*+(){^])/g,
    () => ESCAPE
  ],

  [
    // '\\\\' -> '\\'
    /\\\\/g,
    () => ESCAPE
  ],

  [
    // > The range notation, e.g. [a-zA-Z],
    // > can be used to match one of the characters in a range.

    // `\` is escaped by step 3
    /(\\)?\[([^\]/]*?)(\\*)($|\])/g,
    (match, leadEscape, range, endEscape, close) => leadEscape === ESCAPE
      // '\\[bar]' -> '\\\\[bar\\]'
      ? `\\[${range}${cleanRangeBackSlash(endEscape)}${close}`
      : close === ']'
        ? endEscape.length % 2 === 0
          // A normal case, and it is a range notation
          // '[bar]'
          // '[bar\\\\]'
          ? `[${sanitizeRange(range)}${endEscape}]`
          // Invalid range notaton
          // '[bar\\]' -> '[bar\\\\]'
          : '[]'
        : '[]'
  ],

  // ending
  [
    // 'js' will not match 'js.'
    // 'ab' will not match 'abc'
    /(?:[^*])$/,

    // WTF!
    // https://git-scm.com/docs/gitignore
    // changes in [2.22.1](https://git-scm.com/docs/gitignore/2.22.1)
    // which re-fixes #24, #38

    // > If there is a separator at the end of the pattern then the pattern
    // > will only match directories, otherwise the pattern can match both
    // > files and directories.

    // 'js*' will not match 'a.js'
    // 'js/' will not match 'a.js'
    // 'js' will match 'a.js' and 'a.js/'
    match => /\/$/.test(match)
      // foo/ will not match 'foo'
      ? `${match}$`
      // foo matches 'foo' and 'foo/'
      : `${match}(?=$|\\/$)`
  ],

  // trailing wildcard
  [
    /(\^|\\\/)?\\\*$/,
    (_, p1) => {
      const prefix = p1
        // '\^':
        // '/*' does not match EMPTY
        // '/*' does not match everything

        // '\\\/':
        // 'abc/*' does not match 'abc/'
        ? `${p1}[^/]+`

        // 'a*' matches 'a'
        // 'a*' matches 'aa'
        : '[^/]*';

      return `${prefix}(?=$|\\/$)`
    }
  ],
];

// A simple cache, because an ignore rule only has only one certain meaning
const regexCache = Object.create(null);

// @param {pattern}
const makeRegex = (pattern, ignoreCase) => {
  let source = regexCache[pattern];

  if (!source) {
    source = REPLACERS.reduce(
      (prev, current) => prev.replace(current[0], current[1].bind(pattern)),
      pattern
    );
    regexCache[pattern] = source;
  }

  return ignoreCase
    ? new RegExp(source, 'i')
    : new RegExp(source)
};

const isString = subject => typeof subject === 'string';

// > A blank line matches no files, so it can serve as a separator for readability.
const checkPattern = pattern => pattern
  && isString(pattern)
  && !REGEX_TEST_BLANK_LINE.test(pattern)

  // > A line starting with # serves as a comment.
  && pattern.indexOf('#') !== 0;

const splitPattern = pattern => pattern.split(REGEX_SPLITALL_CRLF);

class IgnoreRule {
  constructor (
    origin,
    pattern,
    negative,
    regex
  ) {
    this.origin = origin;
    this.pattern = pattern;
    this.negative = negative;
    this.regex = regex;
  }
}

const createRule = (pattern, ignoreCase) => {
  const origin = pattern;
  let negative = false;

  // > An optional prefix "!" which negates the pattern;
  if (pattern.indexOf('!') === 0) {
    negative = true;
    pattern = pattern.substr(1);
  }

  pattern = pattern
  // > Put a backslash ("\") in front of the first "!" for patterns that
  // >   begin with a literal "!", for example, `"\!important!.txt"`.
  .replace(REGEX_REPLACE_LEADING_EXCAPED_EXCLAMATION, '!')
  // > Put a backslash ("\") in front of the first hash for patterns that
  // >   begin with a hash.
  .replace(REGEX_REPLACE_LEADING_EXCAPED_HASH, '#');

  const regex = makeRegex(pattern, ignoreCase);

  return new IgnoreRule(
    origin,
    pattern,
    negative,
    regex
  )
};

const throwError = (message, Ctor) => {
  throw new Ctor(message)
};

const checkPath = (path, originalPath, doThrow) => {
  if (!isString(path)) {
    return doThrow(
      `path must be a string, but got \`${originalPath}\``,
      TypeError
    )
  }

  // We don't know if we should ignore EMPTY, so throw
  if (!path) {
    return doThrow(`path must not be empty`, TypeError)
  }

  // Check if it is a relative path
  if (checkPath.isNotRelative(path)) {
    const r = '`path.relative()`d';
    return doThrow(
      `path should be a ${r} string, but got "${originalPath}"`,
      RangeError
    )
  }

  return true
};

const isNotRelative = path => REGEX_TEST_INVALID_PATH.test(path);

checkPath.isNotRelative = isNotRelative;
checkPath.convert = p => p;

class Ignore {
  constructor ({
    ignorecase = true,
    ignoreCase = ignorecase,
    allowRelativePaths = false
  } = {}) {
    define(this, KEY_IGNORE, true);

    this._rules = [];
    this._ignoreCase = ignoreCase;
    this._allowRelativePaths = allowRelativePaths;
    this._initCache();
  }

  _initCache () {
    this._ignoreCache = Object.create(null);
    this._testCache = Object.create(null);
  }

  _addPattern (pattern) {
    // #32
    if (pattern && pattern[KEY_IGNORE]) {
      this._rules = this._rules.concat(pattern._rules);
      this._added = true;
      return
    }

    if (checkPattern(pattern)) {
      const rule = createRule(pattern, this._ignoreCase);
      this._added = true;
      this._rules.push(rule);
    }
  }

  // @param {Array<string> | string | Ignore} pattern
  add (pattern) {
    this._added = false;

    makeArray(
      isString(pattern)
        ? splitPattern(pattern)
        : pattern
    ).forEach(this._addPattern, this);

    // Some rules have just added to the ignore,
    // making the behavior changed.
    if (this._added) {
      this._initCache();
    }

    return this
  }

  // legacy
  addPattern (pattern) {
    return this.add(pattern)
  }

  //          |           ignored : unignored
  // negative |   0:0   |   0:1   |   1:0   |   1:1
  // -------- | ------- | ------- | ------- | --------
  //     0    |  TEST   |  TEST   |  SKIP   |    X
  //     1    |  TESTIF |  SKIP   |  TEST   |    X

  // - SKIP: always skip
  // - TEST: always test
  // - TESTIF: only test if checkUnignored
  // - X: that never happen

  // @param {boolean} whether should check if the path is unignored,
  //   setting `checkUnignored` to `false` could reduce additional
  //   path matching.

  // @returns {TestResult} true if a file is ignored
  _testOne (path, checkUnignored) {
    let ignored = false;
    let unignored = false;

    this._rules.forEach(rule => {
      const {negative} = rule;
      if (
        unignored === negative && ignored !== unignored
        || negative && !ignored && !unignored && !checkUnignored
      ) {
        return
      }

      const matched = rule.regex.test(path);

      if (matched) {
        ignored = !negative;
        unignored = negative;
      }
    });

    return {
      ignored,
      unignored
    }
  }

  // @returns {TestResult}
  _test (originalPath, cache, checkUnignored, slices) {
    const path = originalPath
      // Supports nullable path
      && checkPath.convert(originalPath);

    checkPath(
      path,
      originalPath,
      this._allowRelativePaths
        ? RETURN_FALSE
        : throwError
    );

    return this._t(path, cache, checkUnignored, slices)
  }

  _t (path, cache, checkUnignored, slices) {
    if (path in cache) {
      return cache[path]
    }

    if (!slices) {
      // path/to/a.js
      // ['path', 'to', 'a.js']
      slices = path.split(SLASH);
    }

    slices.pop();

    // If the path has no parent directory, just test it
    if (!slices.length) {
      return cache[path] = this._testOne(path, checkUnignored)
    }

    const parent = this._t(
      slices.join(SLASH) + SLASH,
      cache,
      checkUnignored,
      slices
    );

    // If the path contains a parent directory, check the parent first
    return cache[path] = parent.ignored
      // > It is not possible to re-include a file if a parent directory of
      // >   that file is excluded.
      ? parent
      : this._testOne(path, checkUnignored)
  }

  ignores (path) {
    return this._test(path, this._ignoreCache, false).ignored
  }

  createFilter () {
    return path => !this.ignores(path)
  }

  filter (paths) {
    return makeArray(paths).filter(this.createFilter())
  }

  // @returns {TestResult}
  test (path) {
    return this._test(path, this._testCache, true)
  }
}

const factory = options => new Ignore(options);

const isPathValid = path =>
  checkPath(path && checkPath.convert(path), path, RETURN_FALSE);

factory.isPathValid = isPathValid;

// Fixes typescript
factory.default = factory;

var ignore = factory;

// Windows
// --------------------------------------------------------------
/* istanbul ignore if  */
if (
  // Detect `process` so that it can run in browsers.
  typeof process !== 'undefined'
  && (
    process.env && process.env.IGNORE_TEST_WIN32
    || process.platform === 'win32'
  )
) {
  /* eslint no-control-regex: "off" */
  const makePosix = str => /^\\\\\?\\/.test(str)
  || /["<>|\u0000-\u001F]+/u.test(str)
    ? str
    : str.replace(/\\/g, '/');

  checkPath.convert = makePosix;

  // 'C:\\foo'     <- 'C:\\foo' has been converted to 'C:/'
  // 'd:\\foo'
  const REGIX_IS_WINDOWS_PATH_ABSOLUTE = /^[a-z]:\//i;
  checkPath.isNotRelative = path =>
    REGIX_IS_WINDOWS_PATH_ABSOLUTE.test(path)
    || isNotRelative(path);
}

function slash(path) {
	const isExtendedLengthPath = /^\\\\\?\\/.test(path);
	const hasNonAscii = /[^\u0000-\u0080]+/.test(path); // eslint-disable-line no-control-regex

	if (isExtendedLengthPath || hasNonAscii) {
		return path;
	}

	return path.replace(/\\/g, '/');
}

const toPath = urlOrPath => urlOrPath instanceof URL ? fileURLToPath(urlOrPath) : urlOrPath;

const isNegativePattern = pattern => pattern[0] === '!';

const ignoreFilesGlobOptions = {
	ignore: [
		'**/node_modules',
		'**/flow-typed',
		'**/coverage',
		'**/.git',
	],
	absolute: true,
	dot: true,
};

const GITIGNORE_FILES_PATTERN = '**/.gitignore';

const applyBaseToPattern = (pattern, base) => isNegativePattern(pattern)
	? '!' + require$$0$4.posix.join(base, pattern.slice(1))
	: require$$0$4.posix.join(base, pattern);

const parseIgnoreFile = (file, cwd) => {
	const base = slash(require$$0$4.relative(cwd, require$$0$4.dirname(file.filePath)));

	return file.content
		.split(/\r?\n/)
		.filter(line => line && !line.startsWith('#'))
		.map(pattern => applyBaseToPattern(pattern, base));
};

const toRelativePath = (fileOrDirectory, cwd) => {
	cwd = slash(cwd);
	if (require$$0$4.isAbsolute(fileOrDirectory)) {
		if (slash(fileOrDirectory).startsWith(cwd)) {
			return require$$0$4.relative(cwd, fileOrDirectory);
		}

		throw new Error(`Path ${fileOrDirectory} is not in cwd ${cwd}`);
	}

	return fileOrDirectory;
};

const getIsIgnoredPredicate = (files, cwd) => {
	const patterns = files.flatMap(file => parseIgnoreFile(file, cwd));
	const ignores = ignore().add(patterns);

	return fileOrDirectory => {
		fileOrDirectory = toPath(fileOrDirectory);
		fileOrDirectory = toRelativePath(fileOrDirectory, cwd);
		return ignores.ignores(slash(fileOrDirectory));
	};
};

const normalizeOptions$1 = (options = {}) => ({
	cwd: toPath(options.cwd) || process$1.cwd(),
});

const isIgnoredByIgnoreFiles = async (patterns, options) => {
	const {cwd} = normalizeOptions$1(options);

	const paths = await out(patterns, {cwd, ...ignoreFilesGlobOptions});

	const files = await Promise.all(
		paths.map(async filePath => ({
			filePath,
			content: await require$$0$2.promises.readFile(filePath, 'utf8'),
		})),
	);

	return getIsIgnoredPredicate(files, cwd);
};

const assertPatternsInput = patterns => {
	if (patterns.some(pattern => typeof pattern !== 'string')) {
		throw new TypeError('Patterns must be a string or an array of strings');
	}
};

const toPatternsArray = patterns => {
	patterns = [...new Set([patterns].flat())];
	assertPatternsInput(patterns);
	return patterns;
};

const checkCwdOption = options => {
	if (!options.cwd) {
		return;
	}

	let stat;
	try {
		stat = require$$0$2.statSync(options.cwd);
	} catch {
		return;
	}

	if (!stat.isDirectory()) {
		throw new Error('The `cwd` option must be a path to a directory');
	}
};

const normalizeOptions = (options = {}) => {
	options = {
		ignore: [],
		expandDirectories: true,
		...options,
		cwd: toPath(options.cwd),
	};

	checkCwdOption(options);

	return options;
};

const normalizeArguments = fn => async (patterns, options) => fn(toPatternsArray(patterns), normalizeOptions(options));

const getIgnoreFilesPatterns = options => {
	const {ignoreFiles, gitignore} = options;

	const patterns = ignoreFiles ? toPatternsArray(ignoreFiles) : [];
	if (gitignore) {
		patterns.push(GITIGNORE_FILES_PATTERN);
	}

	return patterns;
};

const getFilter = async options => {
	const ignoreFilesPatterns = getIgnoreFilesPatterns(options);
	return createFilterFunction(
		ignoreFilesPatterns.length > 0 && await isIgnoredByIgnoreFiles(ignoreFilesPatterns, {cwd: options.cwd}),
	);
};

const createFilterFunction = isIgnored => {
	const seen = new Set();

	return fastGlobResult => {
		const path = fastGlobResult.path || fastGlobResult;
		const pathKey = require$$0$4.normalize(path);
		const seenOrIgnored = seen.has(pathKey) || (isIgnored && isIgnored(path));
		seen.add(pathKey);
		return !seenOrIgnored;
	};
};

const unionFastGlobResults = (results, filter) => results.flat().filter(fastGlobResult => filter(fastGlobResult));

const convertNegativePatterns = (patterns, options) => {
	const tasks = [];

	while (patterns.length > 0) {
		const index = patterns.findIndex(pattern => isNegativePattern(pattern));

		if (index === -1) {
			tasks.push({patterns, options});
			break;
		}

		const ignorePattern = patterns[index].slice(1);

		for (const task of tasks) {
			task.options.ignore.push(ignorePattern);
		}

		if (index !== 0) {
			tasks.push({
				patterns: patterns.slice(0, index),
				options: {
					...options,
					ignore: [
						...options.ignore,
						ignorePattern,
					],
				},
			});
		}

		patterns = patterns.slice(index + 1);
	}

	return tasks;
};

const getDirGlobOptions = (options, cwd) => ({
	...(cwd ? {cwd} : {}),
	...(Array.isArray(options) ? {files: options} : options),
});

const generateTasks = async (patterns, options) => {
	const globTasks = convertNegativePatterns(patterns, options);

	const {cwd, expandDirectories} = options;

	if (!expandDirectories) {
		return globTasks;
	}

	const patternExpandOptions = getDirGlobOptions(expandDirectories, cwd);
	const ignoreExpandOptions = cwd ? {cwd} : undefined;

	return Promise.all(
		globTasks.map(async task => {
			let {patterns, options} = task;

			[
				patterns,
				options.ignore,
			] = await Promise.all([
				dirGlob(patterns, patternExpandOptions),
				dirGlob(options.ignore, ignoreExpandOptions),
			]);

			return {patterns, options};
		}),
	);
};

const globby = normalizeArguments(async (patterns, options) => {
	const [
		tasks,
		filter,
	] = await Promise.all([
		generateTasks(patterns, options),
		getFilter(options),
	]);
	const results = await Promise.all(tasks.map(task => out(task.patterns, task.options)));

	return unionFastGlobResults(results, filter);
});

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
    const config = await lib.readJson(`${cwd}/package.json`);
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

// This gulp scripts used to generate @gi folder by ts-for-gir:
//   https://github.com/sammydre/ts-for-gir

const { existsSync, statSync, writeFileSync, readFileSync, rmSync, rm, mkdirSync } = require('fs')
const { exec, execSync } = require('child_process')
const { parallel, series, src, dest } = require('gulp')

const Vinyl = require('vinyl')
const { obj } = require('through2')

const conf = require('../.gi.ts.rc.json')
const LOCK_FILE = 'docs.lock',
  CONFIG_FILE = '.gi.ts.rc.json',
  GI_DIR = conf.options.out

// Update @gi folder when we have edited the `.gi.ts.rc.json`.
// Use docs.lock to record the last modify time.
const should_update = () => {
  if (existsSync(LOCK_FILE)) {
    const last_mtime_ms = Number.parseFloat(readFileSync(LOCK_FILE, 'utf-8'))
    const lasted_mtime_ms = statSync(CONFIG_FILE).mtimeMs
    return last_mtime_ms < lasted_mtime_ms || !existsSync(GI_DIR)
  }
  return true
}

const extra_connect_func = () => obj( /** @param file {Vinyl} */(file, enc, cb) => {
  let res = ''

  let connect_funcs = []
  let collecting = false;

  const lines = file.contents.toString().split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^export.*? class/)) {
      collecting = true
    }

    if (collecting) {
      const match = lines[i].match(/^    connect\((.*)\): number;/)
      if (match) {
        connect_funcs.push(match[1])
      }
    }

    if (lines[i].startsWith('}') && collecting) {
      connect_funcs = connect_funcs.filter(v => !v.includes("id: string"))
      if (connect_funcs.length > 0) {
        const t = `${connect_funcs.map(v => '[' + v + ']').reverse().join(' | ')}`
        res += `    /** */ connect(...args: ${t}): number;\n`
      }

      res += '}'

      connect_funcs = []
      collecting = false
    } else {
      res += (lines[i] + '\n')
    }
  }

  file.contents = Buffer.from(res, enc)
  cb(null, file)
})

const rename_gi = (cb) => {
  if (!should_update()) {
    cb(null)
    return
  }
  // generate name map
  const maps = {}

  /** @param file {Vinyl} */
  const replace_imports = (file, encoding, callback) => {
    rm(file.path, () => { })
    const contents = file.contents.toString().replace(
      /^import \* as (.*?) from "(.*?)"/gm,
      (p0, p1, p2) => {
        if (maps[p2]) {
          return `import * as ${p1} from "${maps[p2]}"`
        } else {
          return p0
        }
      }
    )
    file.contents = Buffer.from(contents, encoding)
    callback(null, file)
  }


  Object.keys(Object.assign({}, conf.libraries_ext, conf.libraries_prefs))
    .forEach(item => maps[item.toLowerCase()] = item)

  return src(`${GI_DIR}/**/*.d.ts`)
    .pipe(extra_connect_func())
    .pipe(obj(replace_imports))
    .pipe(require('gulp-rename')(path => {
      if (maps[path.basename]) {
        path.basename = maps[path.basename]
      }
    }, { multiExt: true }))
    .pipe(dest(GI_DIR))
}

// Generate docs.json from gi.ts.rc.json
// gi-ts will use .ts-for-girrc.js as configuration file.
const generate_gi_prefs = (cb) => {
  if (!should_update()) {
    cb(null)
    return
  }

  mkdirSync('.tmp/prefs', { recursive: true })
  writeFileSync('.tmp/prefs/docs.json', JSON.stringify({
    'libraries': conf.libraries_prefs,
    ...conf
  }))
  exec("cd .tmp/prefs && gi-ts generate", cb)
}

const generate_gi_ext = (cb) => {
  if (!should_update()) {
    cb(null)
    return
  }

  const extra_lib = [
    '/usr/lib64/mutter-10',
    '/usr/lib64/mutter-9',
    '/usr/lib64/mutter-8',
    '/usr/share/gnome-shell'
  ].join(':')
  mkdirSync('.tmp/ext', { recursive: true })
  writeFileSync('.tmp/ext/docs.json', JSON.stringify({
    'libraries': conf.libraries_ext,
    ...conf
  }))
  exec(`cd .tmp/ext && XDG_DATA_DIRS=${extra_lib}:$XDG_DATA_DIRS gi-ts generate`, cb)
}

const generate_gi = series(
  async () => {
    if (should_update()) {
      conf.options.out = `../../${conf.options.out}`
      rmSync(GI_DIR, { recursive: true, force: true })
    }
  },
  parallel(generate_gi_ext, generate_gi_prefs),
  rename_gi,
  async () => {
    if (should_update()) {
      writeFileSync(LOCK_FILE, statSync(CONFIG_FILE).mtimeMs.toString())
      rmSync('.tmp', { recursive: true, force: true })
    }
  }
)

// -------------------------------------------------------- [Export gulp tasks]

exports.gi = generate_gi

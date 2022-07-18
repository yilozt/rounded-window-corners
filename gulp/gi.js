// This gulp scripts used to generate @gi folder by ts-for-gir:
//   https://github.com/sammydre/ts-for-gir

const { existsSync, statSync, writeFileSync, readFileSync, rmSync, rm, mkdirSync } = require('fs')
const { exec, execSync } = require('child_process')
const { parallel, series, src, dest } = require('gulp')

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

// Generate docs.json from gi.ts.rc.json
// gi-ts will use .ts-for-girrc.js as configuration file.
const generate_gi_prefs = () => {
  mkdirSync('.tmp/prefs', {recursive: true})
  writeFileSync('.tmp/prefs/docs.json', JSON.stringify({
    'libraries': conf.libraries_prefs,
    ...conf
  }))
  return exec("cd .tmp/prefs && gi-ts generate")
}

const generate_gi_ext = () => {
  const extra_lib = [
    execSync('find /usr/lib -maxdepth 1 -type d -name \'mutter-*\'').toString().split('\n')[0],
    '/usr/share/gnome-shell'
  ].join(':')
  mkdirSync('.tmp/ext', {recursive: true})
  writeFileSync('.tmp/ext/docs.json', JSON.stringify({
    'libraries': conf.libraries_ext,
    ...conf
  }))
  return exec(`cd .tmp/ext && XDG_DATA_DIRS=${extra_lib}:$XDG_DATA_DIRS gi-ts generate`)
}

const generate_gi = () => {
  if (should_update(LOCK_FILE, CONFIG_FILE)) {
    conf.options.out = `../../${conf.options.out}`
    rmSync(GI_DIR, { recursive: true, force: true })
    return series(
      parallel(generate_gi_ext, generate_gi_prefs),
      rename_gi,
      (cb) => {
        writeFileSync(LOCK_FILE, statSync(CONFIG_FILE).mtimeMs.toString())
        rmSync('.tmp', { recursive: true, force: true })
        cb(null)
      }
    )
  }
  const do_nothing = (cb) => cb(null)
  return series(do_nothing)
}

const Vinyl = require('vinyl')
const rename_gi = () => {
  /** @param file {Vinyl} */
  const { obj } = require('through2')
  const replace_imports = (file, encoding, callback) => {
    rm(file.path, () => { })
    const contents = file.contents.toString().replace(
      /^import \* as (.*?) from "(.*?)"/gm,
      (_, p1, p2) => `import * as ${p1} from "${maps[p2]}"`
    )
    file.contents = Buffer.from(contents, encoding)
    callback(null, file)
  }

  // generate name map
  const maps = {}
  Object.keys(Object.assign({}, conf.libraries_ext, conf.libraries_prefs))
    .forEach(item => maps[item.toLowerCase()] = item)

  return src(`${GI_DIR}/**/*.d.ts`)
    .pipe(obj(replace_imports))
    .pipe(require('gulp-rename')(path => path.basename = maps[path.basename], { multiExt: true }))
    .pipe(dest(GI_DIR))
}

// -------------------------------------------------------- [Export gulp tasks]

exports.gi = series(generate_gi())

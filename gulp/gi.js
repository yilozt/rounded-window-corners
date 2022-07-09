const { series, src, dest } = require('gulp')
const { existsSync, statSync, writeFileSync, readFileSync, rmSync, rm } = require('fs')
const { execSync, exec } = require('child_process')
const rename = require('gulp-rename')
const { obj } = require('through2')
const Vinyl = require('vinyl')

const VAR = 'XDG_DATA_DIRS',
  find_mutter = 'find /usr/lib -maxdepth 1 -type d -name \'mutter-*\'',
  LOCK_FILE = 'docs.lock',
  CONFIG_FILE = 'docs.json',
  GI_DIR = require('../docs.json').options.out

// We should update @gi folder when we have edited the `config_file`
const should_update = () => {
  if (existsSync(LOCK_FILE)) {
    const last_mtime_ms = Number.parseFloat(readFileSync(LOCK_FILE, 'utf-8'))
    const lasted_mtime_ms = statSync(CONFIG_FILE).mtimeMs
    return last_mtime_ms < lasted_mtime_ms || !existsSync(GI_DIR)
  }
  return true
}

const generate_gi = (cb) => {
  if (should_update(LOCK_FILE, CONFIG_FILE)) {
    rmSync(GI_DIR, { recursive: true, force: true })
    console.log(execSync('gi-ts generate').toString())
    writeFileSync(LOCK_FILE, statSync(CONFIG_FILE).mtimeMs.toString())
    return rename_gi ()
  }
  cb (null)
}

const rename_gi = () => {
  /** @param file {Vinyl} */
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
  require('../docs-lock.json')
    .forEach(item => maps[item.name.toLowerCase()] = item.name)

  return src(`${GI_DIR}/**/*.d.ts`)
    .pipe(obj(replace_imports))
    .pipe(rename(path => path.basename = maps[path.basename], { multiExt: true }))
    .pipe(dest(GI_DIR))
}

// Generate docs-lock.json
const types_lock = (cb) => {
  if (existsSync('docs-lock.json')) {
    // Skip when we have generated this file
    cb(null, null)
    return
  }
  // Got path of mutter
  const extra_lib = [
    execSync(find_mutter).toString().split('\n')[0],
    '/usr/share/gnome-shell'
  ].join(':')

  const cmd = `${VAR}=${extra_lib}:$${VAR}  gi-ts config --lock`
  exec(cmd, (err, stdout, stderr) => {
    cb(err)
    if (err)    console.err(stderr)
    if (stdout) console.log(stdout)
  })
}

exports.gi = series(types_lock, generate_gi)

// This gulp scripts used to generate @gi folder by ts-for-gir:
//   https://github.com/sammydre/ts-for-gir

const { existsSync, statSync, writeFileSync, readFileSync, rmSync } = require('fs')
const { spawn } = require('child_process')

const conf = require('../.ts-for-girrc.json')
const LOCK_FILE = 'docs.lock',
  CONFIG_FILE = '.ts-for-girrc.json',
  GI_DIR = conf.outdir

// Update @gi folder when we have edited the `.ts-for-girrc.json`.
// Use docs.lock to record the last modify time.
const should_update = () => {
  if (existsSync(LOCK_FILE)) {
    const last_mtime_ms = Number.parseFloat(readFileSync(LOCK_FILE, 'utf-8'))
    const lasted_mtime_ms = statSync(CONFIG_FILE).mtimeMs
    return last_mtime_ms < lasted_mtime_ms || !existsSync(GI_DIR)
  }
  return true
}

// Generate .ts-for-girrc.js from .ts-for-girrc.json.
// ts-for-gir will use .ts-for-girrc.js as configuration file.
const generate_gi = (cb) => {
  if (should_update(LOCK_FILE, CONFIG_FILE)) {
    rmSync(GI_DIR, { recursive: true, force: true })
    writeFileSync('.ts-for-girrc.js', 'exports.default=' + JSON.stringify(conf))
    return spawn('ts-for-gir' ,['--configName=".ts-for-girrc.js"', 'generate'], { stdio: 'inherit' }).on('close', () => {
      writeFileSync(LOCK_FILE, statSync(CONFIG_FILE).mtimeMs.toString())
    })
  }
  cb (null)
}

// -------------------------------------------------------- [Export gulp tasks]

exports.gi = require('gulp').series(generate_gi)

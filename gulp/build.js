// This gulp script will do those step to build our gnome-shell extensions: 
//   1. Compile typescript
//   2. Format output js files
//   2. Copy all things in Resources into build dir
//   4. Convert import statements into style that Gjs need
//   5. Compile settings schemas in build dir
//   6. [Optional] Install extensions:
//      Copy all things in build dir into ~/.local/share/gnome-shell/extensions

const { dest, src, series, parallel, } = require('gulp')
const ts = require('gulp-typescript')
const prettier = require('gulp-prettier')
const gulpESLintNew = require('gulp-eslint-new')
const colors = require('ansi-colors')
const { po, compile_po } = require('./po')

const tsProject = ts.createProject('tsconfig.json')
const BUILD_DIR = require('../tsconfig.json').compilerOptions.outDir
const SRC_DIR = require('../tsconfig.json').compilerOptions.baseUrl + "/src"

// Compile Typescript source code, because typescript compile will remove all empty
// lines in compiled javascript files, and make the output files looks uncomfortable.
// so We have to use 'gulp-preserve-typescript-whitespace' to add some empty lines in
// compiled javascript files.
//
// [1] https://github.com/microsoft/TypeScript/issues/843
// [2] https://www.npmjs.com/package/gulp-preserve-typescript-whitespace
const { restoreWhitespace, saveWhitespace } = require('gulp-preserve-typescript-whitespace')

const eslint_src = () => gulpESLintNew({
  fix: true,
  overrideConfig: require('../src/.eslintrc.json')
})
const eslint_out = () => gulpESLintNew({
  fix: true,
  overrideConfig: { ...require('../resources/.eslintrc.json') }
})

const compile_ts = () => tsProject.src()  // Setup source
  .pipe(saveWhitespace())                 // Save white-space
  .pipe(tsProject()).js                   // Compile ts into js
  .pipe(restoreWhitespace())              // Restore white space
  .pipe(prettier())                       // Format the output
  .pipe(eslint_out())                     // eslint for output
  .pipe(gulpESLintNew.fix())              // Auto fix
  .pipe(gulpESLintNew.format())
  .pipe(replace())                        // Convert import statements to GJs-compatibility
  .pipe(src([
    `${SRC_DIR}/**/*`,
    `!${SRC_DIR}/**/*.ts`,
    `!${SRC_DIR}/**/*.d.ts`
  ]))                                     // Add *.ui and shaders under src/ into source
  .pipe(dest(BUILD_DIR))                  // Set output

const format = () =>  tsProject.src()
  .pipe(prettier())                       // Format the source
  .pipe(eslint_src())                     // eslint
  .pipe(gulpESLintNew.fix())              // Auto Fix
  .pipe(gulpESLintNew.format())
  .pipe(dest('./src'))

// Compile GSettings schemas in build directory by glib-compile-schemas
// It will stop build process when schemas compile failed.
const compile_schema = (cb) => {
  require('child_process').exec(`cd ${BUILD_DIR} && glib-compile-schemas schemas/`)
    .stderr.on('data', (data) => {
      const out = data.toString()
      if (out.length!= 0) {
        cb(new Error(data))
      }
    }).on('close', () => cb(null))
}

// Copy everything in resources directory into build directory
const copy_resources = () => src('./resources/**/*').
  pipe(dest(BUILD_DIR))

// Install extensions, copy all things in build directory into
// ~/.local/share/gnome-shell/extensions
const install_extension = () => {
  const uuid = require('../resources/metadata.json').uuid
  const extension_dir = require('os').homedir + '/.local/share/gnome-shell/extensions/' + uuid
  require('fs').rmSync(extension_dir, { recursive: true, force: true })
  return src(`${BUILD_DIR}/**`)
    .pipe(dest(extension_dir))
}

// -------------------------------------------------------- [Export gulp tasks]

const compile = series (compile_ts, copy_resources, compile_schema)

exports.build = parallel(format, compile, po)
exports.github_action = series(compile, compile_po)
exports.copy_extension = install_extension

// ---------------------------------------------------------- [Private methods]

const Vinyl = require('vinyl')

// Replace import statements in output files, to let extensions works with gjs
// Convert `import XXX from YYY` into `const XXX = imports.YYY`
// This idea is base on the Pop!_Os does:
//
// https://github.com/pop-os/shell/blob/master_jammy/scripts/transpile.sh
// 
// We can got more flexibility in `replace()` of Javascript.
const replace = () => require('through2').obj(/** @param file {Vinyl} */ function (file, encoding, callback) {
  const ERR_IMPORTS = []

  /**
   * This function device how we replace the match, for example:
   *
   * if we match `import {a, b, c} from './xyz'`, then:
   * - match  => `import {a, b, c} from './xyz'`
   * - p1     => `{a, b, c}`
   * - p2     => `./xyz`
   *
   * if we match `import * as ABC from 'XYZ'`, then:
   * - match  => `import * as ABC from 'XYZ'`
   * - p1     => `{* as ABC}`
   * - p2     => `XYZ`
   *
   * @param {string} match   The matched string
   * @param {string} p1      First group
   * @param {string} p2      Second group
   * @returns {string}       Replace result
   */
  const replace_func = (match, p1, p2) => {
    // We will skip `src/global.d.ts`, because content of this
    // file exits in our gnome shell environments
    if (p2.includes('global')) {
      return ``
    }

    const imports_gi = p2.includes('@gi/') || p2.includes('gi://')

    let res = null

    // Replace import .* as XXX from 'gi://XXX'
    // to import XXX from 'gi://XXX' 
    if (imports_gi) {
      // We will convert `import * as Abc from 'Xyz'`
      // to `const Abc = imports.XXXX`, so ' * as ' is unnecessary
      if (p1.includes('* as')) {
        p1 = p1.replace('* as ', '') + '     '
      }
  
      return `import ${p1} from '${p2}'`
    }

    return match
  }

  let replaced = file.contents.toString()

  // We will handles all import statements with this simple regex express
  replaced = replaced.replace(/import (.*?) from\s+?['"](.*?)['"]/gm, replace_func)
  file.contents = Buffer.from(replaced, encoding)

  // Output error message when we can't understand a import statement.
  if (ERR_IMPORTS.length > 0) {
    console.error(
      colors.red('error '),
      colors.underline('Failed to resolve import statements')
    )
    console.error('')
    ERR_IMPORTS.forEach(match => console.error(colors.grey(`   ${match}`)))
    console.error('')
    console.error(
      colors.bold(colors.red(`✖ ${ERR_IMPORTS.length} error import`)),
      ' in ', colors.bold(file.relative)
    )
    console.error('')
  } else {
    // console.log(colors.bold(colors.green('  √  ')), colors.bold(file.relative))
  }

  callback(null, file)
})

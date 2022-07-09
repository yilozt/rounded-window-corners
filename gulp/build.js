const { restoreWhitespace,
  saveWhitespace,
  PreserveTypescriptWhitespaceOptions
} = require('gulp-preserve-typescript-whitespace')
const { dest, src, pipe, series, } = require('gulp')
const ts = require('gulp-typescript')
const { obj } = require('through2')
const Vinyl = require('vinyl')
const { rmSync } = require('fs')
const { homedir } = require('os')
const colors = require('ansi-colors')

const tsProject = ts.createProject('tsconfig.json')
const BUILD_DIR = require('../tsconfig.json').compilerOptions.outDir
const SRC_DIR = require('../tsconfig.json').compilerOptions.baseUrl

/**
 * @type {PreserveTypescriptWhitespaceOptions}
 */
const preserveConfig = {
  preserveNewLines: true,
  preserveMultipleSpaces: true,
  preserveSpacesBeforeColons: true,
  preserveSameLineElse: true,
  showDebugOutput: true,
}

const copy_resource = () => src('./resource/**').
  pipe(dest(BUILD_DIR))

const install_extension = () => {
  const uuid = require('../resource/metadata.json').uuid
  const extension_dir = homedir + '/.local/share/gnome-shell/extensions/' + uuid
  rmSync(extension_dir, { recursive: true, force: true })
  return src(`${BUILD_DIR}/**`)
    .pipe(dest(extension_dir))
}

/**
 *
 * @returns {NodeJS.ReadWriteStream}
 */
const compile_ts = () => tsProject.src()
  .pipe(saveWhitespace(preserveConfig))
  .pipe(tsProject()).js
  .pipe(restoreWhitespace())
  .pipe(replace_imports())
  .pipe(src([`${SRC_DIR}/**/*`, `!${SRC_DIR}/**/*.ts`, `!${SRC_DIR}/**/*.d.ts`]))
  .pipe(dest(BUILD_DIR))

exports.build_ts = series(compile_ts, copy_resource)
exports.copy_extension = install_extension

//  ========================================================== private methods

const replace_imports = () => obj(/** @param file {Vinyl} */ function (file, encoding, callback) {
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
    // file exits in our gnome shell enviroments
    if (p2.includes('global')) {
      return `// ${match}`
    }

    const imports_gi = p2.includes('@gi/') || p2.includes('gi://')
    const imports_shell = p2.includes('@imports')

    let res = null

    if (imports_gi || imports_shell) {
      // We will convert `import * as Abc from 'Xyz'`
      // to `const Abc = imports.XXXX`, so ' * as ' is unnessary
      p1 = p1.replace('* as ', '')

      if (imports_gi) {
        // When we import something from gi
        // generate const XXX = imports.gi.XXX
        p2 = 'imports.gi.' + p2.replace(/.*@gi\//, '').replace('gi://', '')
      } else if (imports_shell) {
        // When we import something from gnome shell
        // generate const XXX = imports.XXX.XXX
        p2 = 'imports' + p2.replace(/.*@imports/, '').replace(/\//g, '.')
      }
      res = `const ${p1} = ${p2}`
    } else {
      // When we import local modules from our extensions, it must be
      // relative path
      // https://gitlab.gnome.org/GNOME/gjs/-/blob/master/doc/ESModules.md#terminology
      if (!(p2.match(/^\.\.\//) || p2.match(/^\.\//))) {
        ERR_IMPORTS.push(match)
        return `// error: Modules from extension should be import with relative`
            +  ` path => import ${p1} from ${p2}`
      }

      if (!p2.match(/js$/)) {
        p2 += '.js'
      }
      res = `import ${p1} from '${p2}'`
    }
    return res
  }

  let replaced = file.contents.toString()

  // extension.js is entry point of gnome shell extensions, we will process
  // it specially
  const isExtensionJs = file.relative.includes('extension.js')

  // Remove 'export ' in extension.js, because it is not ES modules in our
  // extensions.
  if (isExtensionJs) {
    replaced = replaced.replace(/^export /gm, '')
  }

  // We will haldles all import statements with this simple regex
  // express
  replaced = replaced.replace(/^\s*import\s+(.*)\s+from\s+['"](.*)['"]/gm, replace_func)
  file.contents = Buffer.from(replaced, encoding)

  if (ERR_IMPORTS.length > 0) {
    console.error(
      colors.red('error '),
      colors.underline('Modules from extension should be import with relative path')
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
    // console.log(
    //   colors.bold(colors.green('  √  ')),
    //   'All import converted for  ',
    //   colors.bold(file.relative),
    // )
  }

  callback(null, file)
})


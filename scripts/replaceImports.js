#!/bin/node

/**
 * This script will replace imports statements in *.js in build directory
 * to make it be compatible with Gjs.
 *
 * This feature can be implements regex expression and `replace()` method.
 * see replaceImports below:
 */

/**
 * This function used to replace imports statements of content
 * @param {string} filename
 * @param {string} content  Content of file
 * @returns {string}        Content of file after replace
 */
const replaceImports = (filename, content) => {
  console.log(`${filename}: `)

  // extension.js is entry point of gnome shell extensions, we will process
  // it specially
  const isExtensionJs = filename.includes('extension.js')

  // Result we want
  let replaced = content

  // Remove 'export ' in extension.js, because it is not ES modules in our
  // extensions.
  if (isExtensionJs) {
    replaced = content.replace(/^export /gm, '')
  }

  // We will haldles all import statements with this simple regex
  // express
  replaced = replaced.replace(
    /import (.*) from ['"](.*)['"]/gm,

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
    (match, p1, p2) => {
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
        } else {
          console.error(`ca`)
        }

        res = `const ${p1} = ${p2}`
      } else {
        // When we import local modules from our extensions, it must be
        // relative path
        // https://gitlab.gnome.org/GNOME/gjs/-/blob/master/doc/ESModules.md#terminology
        if (!(p2.match(/^\.\.\//) || p2.match(/^\.\//))) {
          console.error ('[ERR] The path of local modules must be relative path')
          console.error ()
          console.error (`      ${match}`)
          console.error ()
          console.error ('      see: https://gitlab.gnome.org/GNOME/gjs/-/blob/master/doc/ESModules.md#terminology')
          process.exit(1)
        }

        if (!p2.match(/js$/)) {
          p2 += '.js'
        }
        res = `import ${p1} from '${p2}'`
      }

      console.log('  + ' + res)
      return res
    }
  )

  return replaced
}

// Requiremts
const fs = require('fs')
  , path = require('path')
  , process = require('process')

// Dirs
const projDir = `${path.dirname(process.argv[1])}/../`
const buildDir = projDir + `/_build`

// find all javascript files in build directory by `find _build -name *.js`
require('child_process')
  .execSync(`find ${buildDir} -name '*.js'`, { encoding: 'utf-8' })
  .split('\n')
  .filter(file => file.length != 0).forEach(file => {
    // Read content of file
    fs.readFile(file, 'utf-8', (err, content) => {
      if (err) {
        console.error(`Failed to read ${file}`)
        console.error(err)
        process.exit(1)
      }
      fs.writeFileSync(
        file,
        replaceImports(path.relative(buildDir, file), content)
      )
    })
  })

#!/bin/node

// This file is used to make import statements in output javascript
// be be compatible with GJS.

const fs = require('fs')
const path = require('path')
const process = require('process')

const projDir = `${path.dirname(process.argv[1])}/../`
const buildDir = projDir + '/_build'

const config = {}

require('../docs-lock.json').forEach(lib => {
  lib.c_prefix.forEach(prefix => prefix.length == 0 || (config[prefix] = lib.name))
})

require('child_process')
  .execSync(`find ${buildDir} -name *.js`, { encoding: 'utf-8' })
  .split('\n')
  .filter(file => file.length != 0).forEach(file => {
    fs.readFile(file, (err, data) => {
      if (err) {
        console.error(`Failed to read ${file}`)
        console.error(err)
        process.exit(1)
      }

      // replace import selection
      console.log(`${path.relative(buildDir, file)}: `)
      const content = data.toString().replace(
        /import (.*) from '(.*)'/gm,
        /**
         * @param {string} p1 @param {string} p2
         */
        (_, p1, p2) => {
          let res = null
          if (p2.indexOf('@gi/') == 0) {
            res = `const ${p1} = imports.gi.${config[p2.replace('@gi/', '')]}`
          } else if (p2.indexOf('@ui/') == 0) {
            res = `const ${p1} = imports.ui.${p2.replace('@ui/', '').split('/').join('.')}`
          } else if (p2.indexOf('@me/') == 0) {
            res = `const ${p1} = Me.imports.${p2.replace('@me/', '').split('/').join('.')}`
          } else {
            res = ''
          }
          console.log(`  + ${res}`)
          return res
        });
      fs.writeFile(file,
        `'use strict';

// Any imports this extension needs itself must also be imported here
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

${content}
`
        , (err) => {
          if (err) {
            console.error(err)
          }
        })
    })
  })

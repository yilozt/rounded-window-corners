#!/bin/node

// Called by `yarn build:types`
//
// This script is used to rename all `*.d.ts` to gjs prefer style in @gi folder
// according to docs-log.json, because gi-ts generate *d.ts named with
// lowercase, we wan't to rename it with Camel-Case style that is Gjs required.
//
// There is a simple example:
//
// if `gi-ts` generate @gi/object.d.ts, this script will rename it to
// @gi/GObject.d.ts. Because we configure path alias in tsconfig.json, now we
// can import it with:
//
//   import * as gobject from 'gi://GObjecct'
//
// Finally scripts/trans.js will replace this import statement with
//
//   const GObject = imports.gi.GObject
//
// in build directory.

const fs = require('fs'),
      path = require('path'),
      process = require('process')

// Get directory names of @gi/ and this project
const projDir = `${path.dirname(process.argv[1])}/../`
const giDir = projDir + `/@gi`

// This map store rename map, we will use it to rename files
const namesMap = {}

// Load docs-lock.json, then build rename maps, finally nameMap will looks
// like this:
// {
//  ...
//    gobject: 'GObject',
//    gdk:     'Gdk'
//  ...
// }
try {
  require(`${projDir}/docs-lock.json`).forEach(lib => {
    namesMap[lib.name.toLowerCase()] = lib.name
  })
} catch (e) {
  console.error (e.message)
  console.error ('Try to generate it with yarn lock:types')
  process.exit (1)
}

// Rename all *.d.ts in @gi directory, also update import statements in
// those files.
fs.readdirSync(giDir).forEach(filenameWithExt => {
  // If we can got new name from namesMap, we will update import satements
  // in this file.
  const ext = '.d.ts'
  const oldName = path.basename(filenameWithExt, ext)
  const newName = namesMap[oldName]
  if (newName) {
    // Read content of file to update import statements
    fs.readFile(`${giDir}/${filenameWithExt}`, 'utf-8', (_, content) => {
      fs.writeFileSync(
        `${giDir}/${filenameWithExt}`,
        content.replace(/import \* as (.*?) from "(.*?)"/gm, (_, p1, p2) => {
          return `import * as ${p1} from "${namesMap[p2]}"`
        }
      ))
      // After update import statements, rename file.
      fs.renameSync(`${giDir}/${oldName}${ext}`, `${giDir}/${newName}${ext}`)
    })
  }
})

const {series, parallel } = require('gulp')
const { build, copy_extension }  = require('./gulp/build')
const { vagrant } = require('./gulp/vagrant')
const { watch } = require('./gulp/watch')
const { gi } = require('./gulp/gi')

// Generate @gi Folder
exports.gi      = gi
// Build Extension
exports.build   = build
// Build & Install extension
exports.install = series(this.build, copy_extension)

// ----------------------------------------------- [Development Options]

// Watch changes in src/
exports.watch   = series(this.build, watch)
// Watch changes & run extensions in virtual machine
// Need vagrant installed.
exports.vm      = series(this.build, parallel(vagrant, watch))

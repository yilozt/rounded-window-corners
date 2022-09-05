const {series, parallel } = require('gulp')
const { build, copy_extension, github_action }  = require('./gulp/build')
const { vagrant } = require('./gulp/vagrant')
const { watch } = require('./gulp/watch')

// Generate @gi Folder
exports.gi      = require('./gulp/gi').gi
// Build Extension
exports.build   = build
// Build & Install extension
exports.install = series(build, copy_extension)
// Package extensions
exports.pack    = require('./gulp/pack').pack

// ----------------------------------------------- [Development Options]

// Watch changes in src/
exports.watch   = series(this.build, watch(this.build))

// Watch changes and install extensions
exports.dev     = series(this.install, watch(this.install))

// Watch changes & run extensions in virtual machine
// Need vagrant installed.
exports.vm      = series(this.install, parallel(vagrant, watch(this.install)))


exports.github_action = github_action
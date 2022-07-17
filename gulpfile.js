const { parallel, series, watch: w } = require('gulp')
const { build_ts, copy_extension }  = require('./gulp/build')
const { eslint } = require('./gulp/eslint')
const { gi } = require('./gulp/gi')
const { vagrant } = require('./gulp/vagrant')

const watch   = () => w(
  ['./src/**/*', './docs.json', 'resources/**/*'],
  this.build
)

// Generate @gi Folder
exports.gi      = gi

// Build Extension
exports.build   = series(gi, parallel(eslint, build_ts))

// Build & Install extension
exports.install = series(this.build, copy_extension)

// Development Options

// Watch changes in src/
exports.watch   = series(this.build, watch)

// Watch changes & run extensions in virtual machine
// Need vagrant installed.
exports.vm      = series(this.build, parallel(vagrant, watch))

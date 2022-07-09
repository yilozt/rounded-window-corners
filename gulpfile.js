const { parallel, series, watch: w } = require('gulp')
const { build_ts, copy_extension }  = require('./gulp/build')
const { eslint, fix_out_intent} = require('./gulp/eslint')
const { gi } = require('./gulp/gi')
const { vagrant } = require('./gulp/vagrant')

const watch   = () => w(
  ['./src/**/*', './docs.json', 'resource/**/*'],
  { ignoreInitial: false },
  this.install
)

exports.build   = series(gi, parallel(eslint, build_ts), fix_out_intent)
exports.install = series(this.build, copy_extension)
exports.watch   = watch
exports.vm      = parallel(vagrant, this.watch)

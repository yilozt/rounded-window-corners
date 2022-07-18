const { parallel, series, watch: w, src, dest } = require('gulp')
const { build_ts, copy_extension }  = require('./gulp/build')
const { eslint } = require('./gulp/eslint')
const { gi } = require('./gulp/gi')
const { vagrant } = require('./gulp/vagrant')

const prettier = require('gulp-prettier')
const { align_imports } = require('./gulp/format')

const format = series(
  () => {
    return src('src/**/*.ts')
    .pipe(prettier())
    .pipe(align_imports())
    .pipe(dest('src'))
  }, eslint
)

exports.format = format

// Generate @gi Folder
exports.gi      = gi

// Build Extension
exports.build = series(gi, parallel(format, build_ts))

// Build & Install extension
exports.install = series(this.build, copy_extension)

// ---------------------------------------------- [Development Options]

// const create_tmp = () => src('src/**/*').pipe(dest('.tmp'))

// const watch =  () => {
//   const source = 'src/**/*'
//   const watching = w([source, './docs.json', 'resources/**/*'])
//   watching.on('all', () => {
//     watching.unwatch(source)
//     this.build(() => {
//       watching.add(source)
//     })
//   })
//   return watching
// }


// Watch changes in src/

// exports.watch   = series(this.build, watch)

// Watch changes & run extensions in virtual machine
// Need vagrant installed.
exports.vm      = series(this.build, parallel(vagrant /*, watch*/))

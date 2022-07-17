// This gulp scripts use `eslint` to check out code and format
// Output js files in _build directory.

const gulp = require('gulp')
const gulpESLintNew = require('gulp-eslint-new')

// Read configuration from .tsconfig.json
const src_path = require('../tsconfig.json').include
const build_dir = require('../tsconfig.json').compilerOptions.outDir

// Use eslint to check while compile typescript
const eslint = () => gulp.src(src_path)
  .pipe(gulpESLintNew({
    fix: true,
    overrideConfig: require('../src/.eslintrc.json')
  }))
  .pipe(gulpESLintNew.fix())
  .pipe(gulpESLintNew.format())

// Use eslint to format the compiled javascript files
const format_output = () => gulp.src(`${build_dir}/**/*.js`)
  .pipe(gulpESLintNew({
    fix: true,
    overrideConfig: require('../resources/.eslintrc.json')
  }))
  .pipe(gulpESLintNew.fix())
  .pipe(gulpESLintNew.format())

// -------------------------------------------------------- [Export gulp tasks]

exports.eslint = eslint
exports.format_output = format_output

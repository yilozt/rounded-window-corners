const { dest } = require('gulp')
const gulp = require('gulp')
const gulpESLintNew = require('gulp-eslint-new')

const src_pathes = require('../tsconfig.json').include
const build_dir = require('../tsconfig.json').compilerOptions.outDir

const eslint = () => gulp.src(src_pathes)
  .pipe(gulpESLintNew({
    fix: true,
    overrideConfig: require('../src/.eslintrc.json')
  }))
  .pipe(gulpESLintNew.fix())
  .pipe(gulpESLintNew.format())

const fix_out_intent = () => gulp.src(`${build_dir}/**/*.js`)
  .pipe(gulpESLintNew({
    fix: true,
    overrideConfig: require('../resource/.eslintrc.json')
  }))
  .pipe(gulpESLintNew.fix())
  .pipe(gulpESLintNew.format())
  .pipe(dest(build_dir))

exports.eslint = eslint
exports.fix_out_intent = fix_out_intent

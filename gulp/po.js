// This file used to generate po files for extensions

const { GettextExtractor, JsExtractors, HtmlExtractors } = require('gettext-extractor');
const fs = require('fs')
const { uuid } = require('../resources/metadata.json')
const { series, src, dest } = require('gulp')
const fillPotPo = require('gulp-fill-pot-po')
const potomo = require('gulp-potomo');
const rename = require('gulp-rename');

const gen_pot = async () => {
  let extractor = new GettextExtractor()

  extractor.createJsParser([
    JsExtractors.callExpression('_', {
      arguments: {
        text: 0,
        context: 1
      }
    }),
    JsExtractors.callExpression('ngettext', {
      arguments: {
        text: 0,
        textPlural: 1,
        context: 2
      }
    })
  ]).parseFilesGlob('src/**/*.ts')

  extractor.createHtmlParser([
    HtmlExtractors.elementContent('[translatable="yes"]')
  ]).parseFilesGlob('src/**/*.ui')

  fs.mkdirSync('po', { recursive: true })
  extractor.savePotFile(`po/${uuid}.pot`)
  extractor.printStats()
}

const fill_pot = () =>
  src('po/*.pot')
    .pipe(fillPotPo({
      poSources: ['po/*.po'],
      logResult: true,
      appendNonIncludedFromPO: true,
      includePORevisionDate: true,
    }))
    .pipe(dest('po'))

const compile_po = () =>
    src('po/*.po')
    .pipe(potomo())
    .pipe(rename(path => {
      const locale = path.basename
      path.dirname += `/locale/${locale}/LC_MESSAGES`
      path.basename = uuid
    }))
    .pipe(dest('_build'))

exports.po = series(gen_pot, fill_pot, compile_po)
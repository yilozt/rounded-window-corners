// This file used to generate po files for extensions

const { GettextExtractor, JsExtractors, HtmlExtractors } = require('gettext-extractor');
const fs = require('fs')
const { uuid, version } = require('../resources/metadata.json')
const { series, src, dest } = require('gulp')
const potomo = require('gulp-potomo');
const rename = require('gulp-rename');
const fg = require('fast-glob');
const { spawnSync } = require('child_process');
const colors = require('ansi-colors');
const { stdout } = require('process');

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
  extractor.savePotFile(`po/${uuid}.pot`, {
    'Report-Msgid-Bugs-To': 'yilozt@outlook.com',
    'Content-Type': 'text/plain; charset=UTF-8',
    'Project-Id-Version': version,
  })
  extractor.printStats()
}

const fill_pot = async () => {
  const cmd = (command, args) => spawnSync(command, args, { shell: true, stdio: 'inherit' })
  const pot = (await fg('po/*.pot'))[0]
  const po_files = await fg('po/*.po')

  for (const po of po_files) {
    stdout.write(colors.green(`Update ${po} `))
    cmd('msgmerge', [ po, pot, '-o', po ])
  }
}

const compile_po = () =>
    src('po/*.po')
    .pipe(potomo())
    .pipe(rename(path => {
      const locale = path.basename
      path.dirname += `/locale/${locale}/LC_MESSAGES`
      path.basename = uuid
    }))
    .pipe(dest('_build'))

exports.compile_po = compile_po
exports.po = series(gen_pot, fill_pot, compile_po)
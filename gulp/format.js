const through = require('through2')

const align_imports = () => through.obj(function (file, enc, cb) {
  if (!file.contents) {
    cb(null, file)
    return
  }
  /** @type string[] */
  const lines = file.contents.toString().split('\n')
  
  const imports = []
  const props = []
  let max_pos_of_from = 0
  let max_pos_of_colon = 0
  lines.forEach((line, idx) => {
    if (line.trim().startsWith('//') || line.trim().startsWith('* ') || line.trim().startsWith('/* ')) {
      return
    }
    if (line.match(/.* from ['"].*?['"]/)) {
      imports.push(idx)
      max_pos_of_from = Math.max(max_pos_of_from, line.indexOf('from'))
    } else if (line.match(/\s+.*?\!\: .*?/)) {
      props.push(idx)
      max_pos_of_colon = Math.max(max_pos_of_colon, line.indexOf('!:'))
    }
  })

  imports.forEach(idx => {
    const line = lines[idx]
    const offset = max_pos_of_from - line.lastIndexOf('from')
    lines[idx] = line.replace('from', ' '.repeat(offset) + 'from')
  })
  props.forEach(idx => {
    const line = lines[idx]
    const offset = max_pos_of_colon - line.lastIndexOf('!:')
    lines[idx] = line.replace('!:', ' '.repeat(offset+1) + '!:')
  })

  file.contents = Buffer.from(lines.join('\n'), enc)
  cb(null, file)
})

exports.align_imports = align_imports
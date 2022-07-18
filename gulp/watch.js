const { build } = require('./build')

let lock = true
const watch = () => {
  const w = require('chokidar').watch(['./src', './resources'])
  w.on('all', (event, path) => {
    if (lock) {
      return
    }
    console.log('          ', event, path)

      lock = true
      build((err) => {
        if (err) {
          setTimeout(() => lock = false, 2000)
        } else {
          lock = false
        }
      })
  })
  w.on('ready', () => {
    lock = false
    console.log('          ', 'Ready')
  })
}

exports.watch = watch
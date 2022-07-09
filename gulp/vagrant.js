const { series, src } = require("gulp");
const { spawn } = require("child_process")
const colors = require("ansi-colors")
const fs = require('fs')

const vagrant_file = async () => {
  if (fs.existsSync('Vagrantfile')) {
    return
  }

  const lang = process.env['LANG'].split('.')[0]
  if (fs.existsSync(`conf/${lang}.Vagrantfile`)) {
    fs.copyFileSync(`conf/${lang}.Vagrantfile`, `Vagrantfile`)
  } else {
    fs.copyFileSync(`conf/Vagrantfile`, `Vagrantfile`)
  }
}

// We will make output all message from child process here
/**
 *
 * @param {string} cmd
 * @param {string[]} opts
 * @param {import("child_process").SpawnOptions} config
 * @returns
 */
const run_cmd = (cmd, opts, config) => {
  const child = spawn(cmd, opts, {
    'shell': true,
    ...config
  })

  if (!config || !config['stdio']) {
    // handle ssh output for gnome shell simplely
    const handle_output = (data) => {
      let contents = data.toString();
      if (contents.endsWith('\n')) {
        contents = contents.slice(0, contents.length - 1)
      }
      contents.split('\n').forEach(line => {
        let res = line
        if (line.match(/err|Err|Failed|failed/)) {
          res = colors.bold(colors.yellow(line)) // failed message
        } else if (line.match(/^=+>|^\[.*?\]/)) {
          res = colors.bold(line)  // log message
        } else if (line.match(/(.*?:\/\/.*?\:)|(Stack trace)/)) {
          res = colors.red(line)   // stack error
        }

        res = colors.dim(` |  `) + res
        console.log(res)
      })
    }
    child.stdout.on('data', handle_output)
    child.stderr.on('data', handle_output)
  }

  return child
}

const up = () => run_cmd('vagrant', ['up'], { 'stdio': 'inherit'})
const ssh = () => run_cmd('vagrant', ['ssh', '-c', '"journalctl -f -o cat /usr/bin/gnome-shell"'])

exports.vagrant = series(vagrant_file, up, ssh)

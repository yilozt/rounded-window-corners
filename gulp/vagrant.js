// This gulp scripts use to init and start virtual machine which
// use to development gnome-shell extensions.
// It will use the scripts under ./conf to install gnome-shell
// desktop, setup gdm, install virtual box  addition and show
// the log of gnome-shell by vagrant.

const { series, parallel } = require("gulp");

// UUID of extensions
const UUID = require('../resources/metadata.json').uuid

const choice_init_script = () => {
  // Choice scripts to init vm 
  const lang = process.env['LANG'].split('.')[0]
  if (require('fs').existsSync(`conf/${lang}.init_vm.sh`)) {
    return `/scripts/${lang}.init_vm.sh`
  } else {
    return '/scripts/init_vm.sh'
  }
}

// Handle output of log that generate by `vagrant ssh` in this
// function
const run_cmd = (cmd, opts, config) => {
  const child = require("child_process").spawn(cmd, opts, {
    'shell': true,
    ...config
  })

  if (!config || !config['stdio']) {
    const tip = (opts[2].includes('gjs'))
      ? 'preferences : '
      : '  extension : '

    // Add color for output of `vagrant ssh`
    const colors = require("ansi-colors")
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
          res = colors.bold(line)                // log message
        } else if (line.match(/(.*?:\/\/.*?\:)|(Stack trace)/)) {
          res = colors.red(line)                 // stack error
        } else if (line.match(/LOG: /)) {
          res = colors.green(line)               // JS LOG
        }

        res = colors.dim(tip) + res
        console.log(res)
      })
    }
    child.stdout.on('data', handle_output)
    child.stderr.on('data', handle_output)
  }

  return child
}

// -------------------------------------------------------- [Export gulp tasks]

// Start and setup vm by Vagrantfile 
const up = () => run_cmd('vagrant', ['up'], { 'stdio': 'inherit'})

// Install gnome desktop and init vm
const init_vm = () => run_cmd(
  'vagrant',
  ['ssh', '-c', `'sudo ${choice_init_script()}'` ],
  { 'stdio': 'inherit', shell: '/usr/bin/bash'}
)

// Display debug log for our Extension
const watch_shell = () => run_cmd('vagrant', ['ssh', '-c', '"journalctl -f -o cat /usr/bin/gnome-shell"'])

// Display debug log for our preferences pages
const watch_gjs   = () => run_cmd('vagrant', ['ssh', '-c', '"journalctl -f -o cat /usr/bin/gjs"'])

// Enable debug-mode
const enable_debug = () => run_cmd('vagrant', [
  'ssh', '-c',
  '"gsettings --schemadir ' + 
  `/home/vagrant/.local/share/gnome-shell/extensions/${UUID}/schemas set ` +
  'org.gnome.shell.extensions.rounded-window-corners debug-mode true"'
])

exports.vagrant = series(up, init_vm, parallel(enable_debug, watch_shell, watch_gjs))

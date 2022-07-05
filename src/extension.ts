// extension.js
// We will load our app.js in this file but nothing else.

// Load extensions from ./app.js via import(), so that we can
// try ES modules in our extensions.
//
// https://gitlab.gnome.org/GNOME/gjs/-/blob/master/doc/ESModules.md
const extension = import ('./app.js')
   .then (app => new app.Extension ())
   .catch (err => err_msg('Failed to load extensions.', err))

export function enable () {
  extension
    .then(ext => ext?.enable ())
    .catch(err => err_msg('Failed to enable extension', err))
}

export function disable () {
  extension.then(ext => ext?.disable ())
  .catch(err => err_msg('Failed to disable extension', err))
 }

export function init () { /** This function do nothing here */ }

declare const log:any, logError:any
const err_msg = (msg: string, err: any) => {
  log ('[Rounded Corners Effect] ' + msg)
  logError (err)
}

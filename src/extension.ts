/// extension.js
/// We will load our app.js in this file but nothing else.

// Should be set to null when extension is disabled
let extension: Promise<Extension | null> | null = null

export function enable () {
    // Load extensions from ./app.js via import(), so that we can
    // try ES modules in our extensions.
    //
    // https://gitlab.gnome.org/GNOME/gjs/-/blob/master/doc/ESModules.md
    extension = import ('./app.js')
        .then ((app) => new app.Extension ())
        .catch ((e) => {
            err_msg ('Failed to load app.js', e)
            return null
        })
    extension
        ?.then ((ext) => ext?.enable ())
        .catch ((e) => err_msg ('Failed to enable extensions', e))
}

export function disable () {
    extension
        ?.then ((ext) => {
            ext?.disable ()
            extension = null
        })
        .catch ((err) => err_msg ('Failed to disable extension', err))
}

export function init () {
    /** This function do nothing here */
}

import { log, logError } from '@global'
import { Extension }     from 'app'
const err_msg = (msg: string, err: Error) => {
    log ('[Rounded Corners Effect] ' + msg)
    logError (err)
}

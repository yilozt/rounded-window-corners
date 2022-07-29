import * as Gtk                from '@gi/Gtk'
import * as GLib               from '@gi/GLib'
import * as Gio                from '@gi/Gio'
import { log }                 from '@global'

import { getCurrentExtension } from '@imports/misc/extensionUtils'

export function init () {
    /** Do nothing here  */
}

// Preferences has been written by libhandy, to avoid maintain
// different UI for different version of Gnome shell.
// Libhandy is written in Gtk 3, so have to show it in new subprocess.

export function buildPrefsWidget () {
    const widget: any = new Gtk.Box ()

    GLib.idle_add (GLib.PRIORITY_DEFAULT_IDLE, () => {
        (widget.get_root () as Gtk.Window).close ()
        return false
    })

    const script = `${getCurrentExtension ().path}/preferences/index.js`
    const cmd = ['gjs', '-m', script]
    log ('Launch ' + cmd)

    Gio.Subprocess.new (cmd, Gio.SubprocessFlags.NONE)
    return widget
}

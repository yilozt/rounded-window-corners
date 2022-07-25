import * as Gtk                from '@gi/Gtk'
import * as GLib               from '@gi/GLib'
import * as Gio                from '@gi/Gio'
import { imports, log }        from '@global'

import { getCurrentExtension } from '@imports/misc/extensionUtils'

export function init () {
    /** Do nothing here  */
}

export function buildPrefsWidget () {
    // throw Error when libadwaita have not installed.
    imports.gi.Adw

    GLib.idle_add (GLib.PRIORITY_DEFAULT_IDLE, () => {
        (widget.get_root () as Gtk.Window).close ()
        return false
    })

    const widget = new Gtk.Box ()

    const script = `${getCurrentExtension ().path}/preferences/index.js`
    const cmd = ['gjs', '-m', script]
    log ('Launch ' + cmd)

    Gio.Subprocess.new (cmd, Gio.SubprocessFlags.NONE)
    return widget
}

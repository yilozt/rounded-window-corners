// imports.gi
import * as Gio    from '@gi/Gio'
import { Variant } from '@gi/GLib'

// --------------------------------------------------------------- [end imports]

const connect = Gio.DBus.session
const bus_name = 'org.gnome.Shell'
const iface_name = 'yi.github.RoundedCornersEffect'
const obj_path = '/yi/github/RoundedCornersEffect'
const props_name = 'org.freedesktop.DBus.Properties'

/**
 * Call pick() of DBus service, it will open Inspector from gnome-shell to
 * Pick actor on stage.
 */
export function pick () {
    connect.call (
        bus_name,
        obj_path,
        iface_name,
        'pick',
        null,
        null,
        Gio.DBusCallFlags.NO_AUTO_START,
        -1,
        null,
        null
    )
}

/**
 * Connect to 'picked' signal, it will be emit when window is picked
 */
export function on_picked (cb: (wm_instance_class: string) => void) {
    const id = connect.signal_subscribe (
        bus_name,
        iface_name,
        'picked',
        obj_path,
        null,
        Gio.DBusSignalFlags.NONE,
        (conn, sender, obj_path, iface, signal, params) => {
            const val = params.get_child_value (0)
            cb (val.get_string ()[0])
            connect.signal_unsubscribe (id)
        }
    )
}

export function has_blur_loaded (): boolean {
    const reply = connect.call_sync (
        bus_name,
        obj_path,
        props_name,
        'Get',
        new Variant ('(ss)', [iface_name, 'blur_loaded']),
        null,
        Gio.DBusCallFlags.NONE,
        -1,
        null
    )
    return (reply.deep_unpack () as Variant[])[0].get_boolean ()
}

export function on_blur_loaded (cb: () => void): number {
    return connect.signal_subscribe (
        bus_name,
        props_name,
        'PropertiesChanged',
        obj_path,
        null,
        Gio.DBusSignalFlags.NONE,
        () => {
            cb ()
        }
    )
}

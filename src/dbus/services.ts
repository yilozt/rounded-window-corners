// imports.gi
import * as Gio        from '@gi/Gio'
import { Variant }     from '@gi/GLib'

// gnome modules
import { Inspector }   from '@imports/ui/lookingGlass'
import * as Main       from '@imports/ui/main'

// local modules
import { _log }        from '../utils/log'
import { loadFile }    from '../utils/io'

// types
import { WindowActor } from '@gi/Meta'

// --------------------------------------------------------------- [end imports]

const iface = loadFile (import.meta.url, './iface.xml')

export default class {
    DBusImpl = Gio.DBusExportedObject.wrapJSObject (iface, this)

    /** Pick Window for Preferences Page, export to DBus client */
    pick () {
        /** Emit `picked` signal */
        const _send_wm_class_instance = (wm_instance_class: string) => {
            this.DBusImpl.emit_signal (
                'picked',
                new Variant ('(s)', [wm_instance_class])
            )
        }

        new Inspector (Main.createLookingGlass ()).connect (
            'target',
            (me, target, x, y) => {
                _log (`${me}: pick ${target} in ${x}, ${y}`)

                // Remove border effect when window is picked.
                const effect_name = 'lookingGlass_RedBorderEffect'
                target
                    .get_effects ()
                    .filter ((e) => e.toString ().includes (effect_name))
                    .forEach ((e) => target.remove_effect (e))

                // Get wm_class_instance property of window, then pass it DBus
                // client
                const type_str = target.toString ()
                let actor = target as WindowActor
                if (type_str.includes ('MetaSurfaceActor')) {
                    actor = target.get_parent () as WindowActor
                } else if (!type_str.includes ('WindowActor')) {
                    _send_wm_class_instance ('window-not-found')
                    return
                }

                _send_wm_class_instance (
                    actor.meta_window.get_wm_class_instance () ??
                        'window-not-found'
                )
            }
        )
    }

    export () {
        this.DBusImpl.export (
            Gio.DBus.session,
            '/yi/github/RoundedCornersEffect'
        )
        _log ('Dbus Services exported')
    }

    unexport () {
        this.DBusImpl.unexport ()
    }
}

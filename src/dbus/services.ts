// imports.gi
import * as Gio        from '@gi/Gio'
import { Variant }     from '@gi/GLib'

// gnome modules
import { Inspector }   from '@imports/ui/lookingGlass'
import * as Main       from '@imports/ui/main'

// local modules
import { _log }        from '@me/utils/log'
import { load }        from '@me/utils/io'

// types
import { WindowActor } from '@gi/Meta'
import { Me }          from '@global'
import { Actor }       from '@gi/Clutter'
// --------------------------------------------------------------- [end imports]

const iface = load (`${Me.path}/dbus/iface.xml`)

export class Services {
  DBusImpl = Gio.DBusExportedObject.wrapJSObject (iface, this)

  /** Pick Window for Preferences Page, export to DBus client */
  pick () {
    /** Emit `picked` signal, send wm_instance_class of got */
    const _send_wm_class_instance = (wm_instance_class: string) => {
      this.DBusImpl.emit_signal (
        'picked',
        new Variant ('(s)', [wm_instance_class])
      )
    }

    // A very interesting way to pick a window:
    // 1. Open LookingGlass to mask all event handles of window
    // 2. Use inspector to pick window, thats is also lookingGlass do
    // 3. Close LookingGlass when done
    //    It will restore event handles of window

    // Open then hide LookingGlass
    const looking_class = Main.createLookingGlass ()
    looking_class.open ()
    looking_class.hide ()

    // Inspect window now
    const inspector = new Inspector (Main.createLookingGlass ())
    inspector.connect ('target', (me, target, x, y) => {
      _log (`${me}: pick ${target} in ${x}, ${y}`)

      // Remove border effect when window is picked.
      const effect_name = 'lookingGlass_RedBorderEffect'
      target
        .get_effects ()
        .filter ((e) => e.toString ().includes (effect_name))
        .forEach ((e) => target.remove_effect (e))

      let actor: Actor | null = target

      // User will pick to a Meta.SurfaceActor in most time, let's find the
      // associate Meta.WindowActor
      for (let i = 0; i < 2; i++) {
        if (actor == null || actor instanceof WindowActor) break
        // If picked actor is not a Meta.WindowActor, search it's parent
        actor = actor.get_parent ()
      }

      if (!(actor instanceof WindowActor)) {
        _send_wm_class_instance ('window-not-found')
        return
      }

      _send_wm_class_instance (
        actor.meta_window.get_wm_class_instance () ?? 'window-not-found'
      )
    })
    inspector.connect ('closed', () => {
      // Close LookingGlass When we done
      looking_class.close ()
    })
  }

  export () {
    this.DBusImpl.export (Gio.DBus.session, '/yi/github/RoundedCornersEffect')
    _log ('DBus Services exported')
  }

  unexport () {
    this.DBusImpl.unexport ()
  }
}

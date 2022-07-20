// gnome modules
import { Inspector }   from '@imports/ui/lookingGlass'
import * as Main       from '@imports/ui/main'

// local modules
import { connections } from '../connections'
import settings        from './settings'
import { _log }        from './log'

// types
import * as Gio        from '@gi/Gio'
import { WindowActor } from '@gi/Meta'
import { SchemasKeys } from './settings'

// --------------------------------------------------------------- [end imports]

/** Waiting pick window button from preferences window clicked  */
export const init = () => {
    const g_settings = settings ().g_settings
    connections ().connect (
        g_settings,
        'changed',
        (_: Gio.Settings, key: string) => on_setting_changed (key)
    )
}

const on_setting_changed = (key: string) => {
    if ((key as SchemasKeys) == 'picked-window') {
        if (settings ().picked_window != '') {
            return
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

                // Get wm_class_instance property of window, then pass it to
                // preferences by GSettings
                const type_str = target.toString ()
                let actor = target as WindowActor
                if (type_str.includes ('MetaSurfaceActor')) {
                    actor = target.get_parent () as WindowActor
                } else if (!type_str.includes ('WindowActor')) {
                    settings ().picked_window = 'window-not-found'
                    return
                }

                settings ().picked_window =
                    actor.meta_window.get_wm_class_instance () ??
                    'window-not-found'
            }
        )
    }
}

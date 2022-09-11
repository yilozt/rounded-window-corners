import * as Clutter                   from '@gi/Clutter'
import { source_remove, timeout_add } from '@gi/GLib'
import { WindowActor }                from '@gi/Meta'
import { global }                     from '@global'
import { RoundedCornersManager }      from '@me/manager/rounded_corners_manager'

export class CompizeAlikeMagicLampEffect {
    rounded_corners_manager: RoundedCornersManager | null = null
    minimized_id = 0
    unminimize_id = 0
    timeout_id = 0

    enable (rounded_corners_manager: RoundedCornersManager | null) {
        this.rounded_corners_manager = rounded_corners_manager

        const wm = global.window_manager

        // Connect 'minimized' signal, hide shadow actor when window minimized
        this.minimized_id = wm.connect_after ('minimize', (_, actor) => {
            this.rounded_corners_manager?.hide_shadow (actor.meta_window)
            return false
        })

        // Restore visible of shadow when un-minimized
        this.unminimize_id = wm.connect_after ('unminimize', (_, actor) => {
            this.timeout_id = timeout_add (0, 10, () => {
                this._restore_shadow (actor)
                return false
            })
        })
    }

    private _restore_shadow (actor: WindowActor) {
        const manager = this.rounded_corners_manager
        // Handle visible of shader with Compiz alike magic lamp effect
        // After MagicLampUnminimizeEffect completed, then show shadow
        //
        // https://github.com/hermes83/compiz-alike-magic-lamp-effect
        const effect = actor.get_effect ('unminimize-magic-lamp-effect')
        if (!effect) {
            manager?.restore_shadow (actor.meta_window)
            return
        }

        type Effect = Clutter.Effect & { timerId: Clutter.Timeline }
        const timer_id = (effect as Effect).timerId

        const id = timer_id.connect ('new-frame', (source) => {
            if (timer_id.get_progress () > 0.98) {
                manager?.restore_shadow (actor.meta_window)
                source.disconnect (id)
            }
        })
    }

    disable () {
        this.rounded_corners_manager = null
        if (this.minimized_id != 0) {
            global.window_manager.disconnect (this.minimized_id)
            this.minimized_id = 0
        }
        if (this.unminimize_id != 0) {
            global.window_manager.disconnect (this.unminimize_id)
            this.unminimize_id = 0
        }
        source_remove (this.timeout_id)
    }
}

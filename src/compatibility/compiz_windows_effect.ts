// eslint max-len 256

import * as Meta                      from '@gi/Meta'
import * as Clutter                   from '@gi/Clutter'
import { Bin }                        from '@gi/St'
import { global }                     from '@global'
import { RoundedCornersManager }      from '@me/manager/rounded_corners_manager'
import { Connections }                from '@me/utils/connections'
import { source_remove, timeout_add } from '@gi/GLib'

export class CompizeWindowEffect {
    manager: RoundedCornersManager | null = null
    connections: Connections | null = null

    EFFECT_NAME = 'wobbly-compiz-effect'
    allowedResizeOp = [
        Meta.GrabOp.RESIZING_W,
        Meta.GrabOp.RESIZING_E,
        Meta.GrabOp.RESIZING_S,
        Meta.GrabOp.RESIZING_N,
        Meta.GrabOp.RESIZING_NW,
        Meta.GrabOp.RESIZING_NE,
        Meta.GrabOp.RESIZING_SE,
        Meta.GrabOp.RESIZING_SW,
    ]
    timeout_id = 0

    enable (rounded_corners_manager: RoundedCornersManager) {
        this.manager = rounded_corners_manager
        this.connections = new Connections ()

        const display = global.display
        this.connections.connect (
            display,
            'grab-op-begin',
            (_: Meta.Display, win: Meta.Window, op: Meta.GrabOp) =>
                (this.timeout_id = timeout_add (0, 10, () => {
                    this.grabStart (win, op)
                    return false
                }))
        )
        this.connections.connect (
            display,
            'grab-op-end',
            (_: Meta.Display, win: Meta.Window, op: Meta.GrabOp) =>
                (this.timeout_id = timeout_add (0, 10, () => {
                    this.grabEnd (win, op)
                    return false
                }))
        )
    }

    private grabStart (window: Meta.Window, op: Meta.GrabOp) {
        if (!op) {
            return
        }

        const actor: Meta.WindowActor | null = window.get_compositor_private ()
        if (actor?.get_effect (this.EFFECT_NAME)) {
            const shadow = this.manager?.query_shadow (window)
            this.manager?.hide_shadow (window)
            if (shadow) {
                (shadow.first_child as Bin).style = 'opacity: 0;'
            }
        }
    }

    private grabEnd (window: Meta.Window, op: Meta.GrabOp) {
        if (!op) {
            return
        }

        const actor: Meta.WindowActor = window.get_compositor_private ()

        const effect = actor?.get_effect (this.EFFECT_NAME)
        if (!effect) {
            this.manager?.restore_shadow (window)
            this.manager?._on_focus_changed (window)
            return
        }
        this.manager?.restore_shadow (window)

        type Effect = Clutter.Effect & { timerId: Clutter.Timeline }
        const timer_id = (effect as Effect).timerId

        if (op == Meta.GrabOp.MOVING) {
            const id = timer_id.connect ('stopped', (source) => {
                this.manager?._on_focus_changed (window)
                source.disconnect (id)
            })
        }
        if (this.allowedResizeOp.includes (op)) {
            const id = timer_id.connect ('new-frame', (source) => {
                if (timer_id.get_progress () > 0.9) {
                    this.manager?._on_focus_changed (window)
                    source.disconnect (id)
                }
            })
        }
    }

    disable () {
        this.connections?.disconnect_all ()
        this.connections = null

        this.manager = null

        source_remove (this.timeout_id)
    }
}

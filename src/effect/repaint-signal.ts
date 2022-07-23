import { Effect, EffectPaintFlags, PaintContext, PaintNode } from '@gi/Clutter'
import { registerClass }                                     from '@gi/GObject'

/**
 * A Effect to reduce shadow of blur effect. It will emit repaint signal when
 * actor should be update, this effect is used to reduce shadow of blur effect
 *
 * This effect is borrowed from blur-my-shell project:
 *
 * https://github.com/aunetx/blur-my-shell/blob/master/src/effects/
 * paint_signals.js#L58
 *
 * Author: Aurélien Hamy
 * Licenses: GNU General Public License v3.0
 */
export default registerClass (
    {
        Signals: {
            repaint: {},
        },
    },
    class extends Effect {
        private counter = 0

        vfunc_paint (
            node: PaintNode,
            ctx: PaintContext,
            flags: EffectPaintFlags
        ): void {
            super.vfunc_paint (node, ctx, flags)
            if (this.counter === 0) {
                this.counter = 2
                this.emit ('repaint')
            }
            this.counter--
        }
    }
)

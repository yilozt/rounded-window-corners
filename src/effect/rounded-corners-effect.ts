// imports.gi
import { registerClass }           from '@gi/GObject'
import { GLSLEffect, SnippetHook } from '@gi/Shell'

// local modules
import { loadShader }              from '../utils/io'
import * as types                  from '../utils/types'

// -------------------------------------------------------------- [end imports]

// Load fragment shader of rounded corners effect.
const { declarations, code } = loadShader (
    import.meta.url,
    './shader/rounded_corners.frag'
)

/** Location of uniform variants of rounded corners effect */
class Uniforms {
    bounds = 0
    clip_radius = 0
    smoothing = 0
    inner_bounds = 0
    inner_clip_radius = 0
    pixel_step = 0
    skip = 0
    border_width = 0
    border_color = 0
}

export default registerClass (
    {},
    class Effect extends GLSLEffect {
        /**
         * Location of uniforms variants in shader, Cache those location
         * when shader has been setup in `vfunc_build_pipeline()`, sot that
         * avoid to yse `this.get_uniform_location()` to query too much times.
         */
        static uniforms: Uniforms = new Uniforms ()

        /**
         * Wether skip rounded corners effect, its useful to disable rounded
         * corners when window is maximized
         */
        private _skip = false

        /**
         * Collect location of uniform variants, only used when added shader
         * snippet to effect.
         */
        private _init_uniforms () {
            Effect.uniforms = {
                bounds: 0,
                clip_radius: 0,
                smoothing: 0,
                inner_bounds: 0,
                inner_clip_radius: 0,
                pixel_step: 0,
                skip: 0,
                border_width: 0,
                border_color: 0,
            }
            Object.keys (Effect.uniforms).forEach ((k) => {
                if (!Effect.uniforms) return
                Effect.uniforms[k as keyof Uniforms] =
                    this.get_uniform_location (k)
            })
        }

        vfunc_build_pipeline (): void {
            const type = SnippetHook.FRAGMENT
            this.add_glsl_snippet (type, declarations, code, false)
            this._init_uniforms ()
        }

        /**
         * Used to update uniform variants of shader
         * @param corners_cfg   - Rounded corners settings of window
         * @param bounds_cfg - Outer bounds of rounded corners
         */
        update_uniforms (
            scale_factor: number,
            corners_cfg: types.RoundedCornersCfg,
            outer_bounds: types.Bounds,
            border: {
                width: number
                color: [number, number, number, number]
            }
        ) {
            const actor = this.actor

            const border_width = border.width * scale_factor
            const border_color = border.color

            const radius = corners_cfg.border_radius * scale_factor
            const { padding, smoothing } = corners_cfg

            const bounds = [
                outer_bounds.x1 + padding.left * scale_factor,
                outer_bounds.y1 + padding.top * scale_factor,
                outer_bounds.x2 - padding.right * scale_factor,
                outer_bounds.y2 - padding.bottom * scale_factor,
            ]

            const inner_bounds = [
                bounds[0] + border_width,
                bounds[1] + border_width,
                bounds[2] - border_width,
                bounds[3] - border_width,
            ]

            let inner_radius = radius - border_width
            if (inner_radius < 0.001) {
                inner_radius = 0.0
            }

            const pixel_step = [1 / actor.get_width (), 1 / actor.get_height ()]
            const _skip = this._skip ? 1 : 0

            const location = Effect.uniforms
            this.set_uniform_float (location.bounds, 4, bounds)
            this.set_uniform_float (location.inner_bounds, 4, inner_bounds)
            this.set_uniform_float (location.pixel_step, 2, pixel_step)
            this.set_uniform_float (location.border_width, 1, [border_width])
            this.set_uniform_float (location.smoothing, 1, [smoothing])
            this.set_uniform_float (location.clip_radius, 1, [radius])
            this.set_uniform_float (location.border_color, 4, border_color)
            this.set_uniform_float (location.inner_clip_radius, 1, [
                inner_radius,
            ])
            this.set_uniform_float (location.skip, 1, [_skip])
            this.queue_repaint ()
        }

        set skip (skip: boolean) {
            this._skip = skip
            const location = Effect.uniforms.skip
            this.set_uniform_float (location, 1, [this._skip ? 1.0 : 0.0])
            this.queue_repaint ()
        }
    }
)

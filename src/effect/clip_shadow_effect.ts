// imports.gi
import * as GObject                from '@gi/GObject'
import { SnippetHook, GLSLEffect } from '@gi/Shell'

// local modules
import { loadShader }              from '@me/utils/io'

// types
import { Me }                      from '@global'
import { PaintContext, PaintNode } from '@gi/Clutter'

// ------------------------------------------------------------------- [imports]

const { declarations, code } = loadShader (
    `${Me.path}/effect/shader/clip_shadow.frag`
)

export const ClipShadowEffect = GObject.registerClass (
    {},
    class extends GLSLEffect {
        vfunc_build_pipeline (): void {
            const hook = SnippetHook.FRAGMENT
            this.add_glsl_snippet (hook, declarations, code, false)
        }

        vfunc_paint_target (node: PaintNode, ctx: PaintContext) {
            // Reset to default blend string.
            this.get_pipeline ()?.set_blend (
                'RGBA = ADD(SRC_COLOR, DST_COLOR*(1-SRC_COLOR[A]))'
            )
            super.vfunc_paint_target (node, ctx)
        }
    }
)

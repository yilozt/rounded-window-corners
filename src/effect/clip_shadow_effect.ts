// imports.gi
import { PaintContext, PaintNode } from '@gi/Clutter'
import * as GObject                from '@gi/GObject'
import { SnippetHook, GLSLEffect } from '@gi/Shell'

// local modules
import { loadShader }              from '../utils/io'

// ------------------------------------------------------------------- [imports]

const { declarations, code } = loadShader (
    import.meta.url,
    './shader/clip_shadow.frag'
)

class ClipShadowEffect extends GLSLEffect {
    vfunc_build_pipeline (): void {
        this.add_glsl_snippet (SnippetHook.FRAGMENT, declarations, code, false)
    }

    vfunc_paint_target (node: PaintNode, ctx: PaintContext) {
        // Reset to default blend string.
        this.get_pipeline ()?.set_blend (
            'RGBA = ADD(SRC_COLOR, DST_COLOR*(1-SRC_COLOR[A]))'
        )
        super.vfunc_paint_target (node, ctx)
    }
}

export default GObject.registerClass ({}, ClipShadowEffect)

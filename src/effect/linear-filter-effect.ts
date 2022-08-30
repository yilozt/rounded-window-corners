import { PaintNode, PaintContext } from '@gi/Clutter'
import { PipelineFilter }          from '@gi/Cogl'
import { registerClass }           from '@gi/GObject'
import { GLSLEffect, SnippetHook } from '@gi/Shell'

export default registerClass (
    {},
    class extends GLSLEffect {
        vfunc_build_pipeline (): void {
            this.add_glsl_snippet (
                SnippetHook.FRAGMENT,
                '',
                'cogl_color_out = cogl_color_out;',
                false
            )
        }

        vfunc_paint_target (node: PaintNode, ctx: PaintContext): void {
            this.get_pipeline ()?.set_layer_filters (
                0,
                PipelineFilter.LINEAR_MIPMAP_LINEAR,
                PipelineFilter.NEAREST
            )
            super.vfunc_paint_target (node, ctx)
        }
    }
)

import * as Clutter from 'gi://Clutter'
import * as Cogl from 'gi://Cogl'
import * as GObject from 'gi://GObject'
import * as Shell from 'gi://Shell'

export const LinearFilterEffect = GObject.registerClass (
  {},
  class extends Shell.GLSLEffect {
    vfunc_build_pipeline (): void {
      this.add_glsl_snippet (Shell.SnippetHook.FRAGMENT, '', '', false)
    }

    vfunc_paint_target (
      node: Clutter.PaintNode,
      ctx: Clutter.PaintContext
    ): void {
      this.get_pipeline ()?.set_layer_filters (
        0,
        Cogl.PipelineFilter.LINEAR_MIPMAP_LINEAR,
        Cogl.PipelineFilter.NEAREST
      )
      super.vfunc_paint_target (node, ctx)
    }
  }
)

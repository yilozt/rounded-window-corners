import { registerClass } from 'gi://GObject'
import { GLSLEffect, SnippetHook } from 'gi://Shell'

export default registerClass({
  Properties: {}
},
class GrayEffect extends GLSLEffect {
  _init(): void {
    super._init()
  }

  vfunc_build_pipeline(): void {
    const fragmentCode = `
        float gray = (cogl_color_out.r + cogl_color_out.g +  cogl_color_out.b) / 3;
        cogl_color_out = vec4(vec3(gray), cogl_color_out.a);
      `

    this.add_glsl_snippet(SnippetHook.FRAGMENT, '', fragmentCode, false)
  }
})

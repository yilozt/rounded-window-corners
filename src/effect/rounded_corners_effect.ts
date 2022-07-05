import { log } from '@global'

import { registerClass } from 'gi://GObject'
import { GLSLEffect, SnippetHook } from 'gi://Shell'

export default registerClass (
  {},
  class RoundedCornersEffect extends GLSLEffect {
    vfunc_build_pipeline (): void {
      this.add_glsl_snippet (SnippetHook.FRAGMENT, '', '', false)
      log ('vfunc_build_pipeline')
    }
  }
)
